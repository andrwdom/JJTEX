import CarouselBanner from '../models/CarouselBanner.js';
import path from 'path';
import fs from 'fs';

// Get all carousel banners
export const getCarouselBanners = async (req, res) => {
  try {
    // Check if this is an admin request (has admin middleware)
    const isAdminRequest = req.user && req.user.role === 'admin';
    
    let banners;
    if (isAdminRequest) {
      // Admin gets all banners (including inactive ones)
      banners = await CarouselBanner.find({}).sort({ order: 1 });
    } else {
      // Public gets only active banners
      banners = await CarouselBanner.find({ isActive: { $ne: false } }).sort({ order: 1 });
    }
    
    // Transform data to match frontend expectations
    const carouselData = banners.map(banner => ({
      id: banner._id.toString(),
      _id: banner._id.toString(),
      url: banner.image,
      image: banner.image,
      alt: banner.title || 'Carousel banner',
      title: banner.title,
      description: banner.description || '',
      link: banner.link || null,
      buttonText: banner.buttonText || null,
      sectionId: banner.sectionId || null,
      order: banner.order || 0,
      isActive: banner.isActive !== false,
      createdAt: banner.createdAt?.toISOString(),
      updatedAt: banner.updatedAt?.toISOString()
    }));

    res.json({
      success: true,
      data: carouselData,
      message: 'Carousel images retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching carousel banners:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch carousel images',
      error: error.message 
    });
  }
};

// Create a new carousel banner
export const createCarouselBanner = async (req, res) => {
  try {
    const { title, description, link, buttonText, sectionId, order, isActive } = req.body;
    const imageFile = req.file;

    if (!imageFile) {
      return res.status(400).json({ 
        success: false,
        message: 'Image is required' 
      });
    }

    if (!title) {
      return res.status(400).json({ 
        success: false,
        message: 'Title is required' 
      });
    }

    // Ensure image is saved to VPS directory
    // The multer middleware already handles saving to uploads/carousel/
    // We just need to construct the proper URL
    const baseUrl = process.env.BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'https://jjtextiles.in';
    const imageUrl = `${baseUrl}/images/carousel/${imageFile.filename}`;

    const banner = new CarouselBanner({
      image: imageUrl,
      title,
      description: description || '',
      link: link || null,
      buttonText: buttonText || null,
      sectionId: sectionId || null,
      order: order ? parseInt(order) : 0,
      isActive: isActive === 'true' || isActive === true || isActive === undefined
    });

    await banner.save();
    
    res.status(201).json({
      success: true,
      data: banner,
      message: 'Banner created successfully'
    });
  } catch (error) {
    console.error('Banner creation error:', error);
    res.status(400).json({ 
      success: false,
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Update a carousel banner
export const updateCarouselBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, link, buttonText, sectionId, order, isActive } = req.body;
    const imageFile = req.file;

    const updateData = {};
    
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (link !== undefined) updateData.link = link || null;
    if (buttonText !== undefined) updateData.buttonText = buttonText || null;
    if (sectionId !== undefined) updateData.sectionId = sectionId || null;
    if (order !== undefined) updateData.order = parseInt(order) || 0;
    if (isActive !== undefined) {
      updateData.isActive = isActive === 'true' || isActive === true;
    }

    // If new image is uploaded, update the image URL
    if (imageFile) {
      const baseUrl = process.env.BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'https://jjtextiles.in';
      const imageUrl = `${baseUrl}/images/carousel/${imageFile.filename}`;
      updateData.image = imageUrl;
      
      // Optionally delete old image file from VPS
      // (You can implement this if needed)
    }

    const banner = await CarouselBanner.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!banner) {
      return res.status(404).json({ 
        success: false,
        message: 'Banner not found' 
      });
    }

    res.json({
      success: true,
      data: banner,
      message: 'Banner updated successfully'
    });
  } catch (error) {
    console.error('Update banner error:', error);
    res.status(400).json({ 
      success: false,
      message: error.message 
    });
  }
};

// Delete a carousel banner
export const deleteCarouselBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const banner = await CarouselBanner.findById(id);

    if (!banner) {
      return res.status(404).json({ 
        success: false,
        message: 'Banner not found' 
      });
    }

    // Delete image file from VPS if it exists
    try {
      if (banner.image) {
        const imagePath = banner.image.replace(/^https?:\/\/[^\/]+/, '');
        const uploadsBase = process.env.UPLOAD_PATH || './uploads';
        const fullPath = path.join(uploadsBase, 'carousel', path.basename(imagePath));
        
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
          console.log('Deleted image file:', fullPath);
        }
      }
    } catch (fileError) {
      console.error('Error deleting image file:', fileError);
      // Continue with banner deletion even if file deletion fails
    }

    await CarouselBanner.findByIdAndDelete(id);

    res.json({ 
      success: true,
      message: 'Banner deleted successfully' 
    });
  } catch (error) {
    console.error('Delete banner error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// Update banner order
export const updateBannerOrder = async (req, res) => {
  try {
    const { orders } = req.body;

    if (!Array.isArray(orders)) {
      return res.status(400).json({ 
        success: false,
        message: 'Orders must be an array' 
      });
    }

    const updatePromises = orders.map(({ id, order }) =>
      CarouselBanner.findByIdAndUpdate(id, { order: parseInt(order) || 0 }, { new: true })
    );

    await Promise.all(updatePromises);
    res.json({ 
      success: true,
      message: 'Banner order updated successfully' 
    });
  } catch (error) {
    console.error('Update banner order error:', error);
    res.status(400).json({ 
      success: false,
      message: error.message 
    });
  }
}; 