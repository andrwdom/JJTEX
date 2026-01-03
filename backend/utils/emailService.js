import nodemailer from 'nodemailer';
import EnhancedLogger from './enhancedLogger.js';

/**
 * Email service for draft order recovery
 * Implements industry-standard email recovery patterns from Klaviyo/Emarsys
 */

// Create email transporter (prefers SMTP_* config, falls back to EMAIL_*)
const createTransporter = () => {
  // Prefer explicit SMTP_* configuration (like invoice generator)
  const hasSmtpConfig = Boolean(
    process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS
  );

  if (hasSmtpConfig) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: String(process.env.SMTP_SECURE).toLowerCase() === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Fall back to Gmail via EMAIL_* variables
  return nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

/**
 * Send draft recovery email with 24-hour expiration
 * Research: Klaviyo/Emarsys show 50% recovery rate with timed emails
 */
export const sendDraftRecoveryEmail = async (emailData) => {
  const correlationId = `EMAIL-${Date.now()}`;
  
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@jjtextiles.in',
      to: emailData.to,
      subject: `Complete Your Order - ${emailData.orderId}`,
      html: generateRecoveryEmailHTML(emailData)
    };
    
    await transporter.sendMail(mailOptions);
    
    EnhancedLogger.webhookLog('SUCCESS', 'Draft recovery email sent', {
      correlationId,
      orderId: emailData.orderId,
      email: emailData.to,
      expiresAt: emailData.expiresAt
    });
    
    return { success: true, correlationId };
    
  } catch (error) {
    EnhancedLogger.webhookLog('ERROR', 'Failed to send draft recovery email', {
      correlationId,
      orderId: emailData.orderId,
      email: emailData.to,
      error: error.message
    });
    
    return { success: false, error: error.message, correlationId };
  }
};

/**
 * Generate HTML email template for draft recovery
 */
const generateRecoveryEmailHTML = (emailData) => {
  const { orderId, amount, items, checkoutUrl, expiresAt } = emailData;
  
  const itemsHTML = items.map(item => 
    `<tr>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.size}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">₹${item.price}</td>
    </tr>`
  ).join('');
  
  const expiresIn = new Date(expiresAt).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Complete Your Order - ${orderId}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      
      <!-- Header -->
      <div style="background: #007bff; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">Complete Your Order</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">Order #${orderId}</p>
      </div>
      
      <!-- Main Content -->
      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px;">
        
        <p style="font-size: 16px; margin-bottom: 20px;">Hi there!</p>
        
        <p style="font-size: 16px; margin-bottom: 20px;">
          We noticed you started an order but didn't complete the payment. 
          <strong>Your items are still reserved for you!</strong>
        </p>
        
        <!-- Order Summary -->
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #007bff;">Order Summary</h3>
          
          <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
            <thead>
              <tr style="background: #f8f9fa;">
                <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Item</th>
                <th style="padding: 12px; text-align: center; border-bottom: 2px solid #dee2e6;">Size</th>
                <th style="padding: 12px; text-align: center; border-bottom: 2px solid #dee2e6;">Qty</th>
                <th style="padding: 12px; text-align: right; border-bottom: 2px solid #dee2e6;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHTML}
            </tbody>
          </table>
          
          <div style="text-align: right; margin-top: 15px; padding-top: 15px; border-top: 2px solid #dee2e6;">
            <h3 style="margin: 0; color: #007bff;">Total: ₹${amount}</h3>
          </div>
        </div>
        
        <!-- Call to Action -->
        <div style="text-align: center; margin: 30px 0;">
          <a href="${checkoutUrl}" 
             style="background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-size: 18px; font-weight: bold; display: inline-block;">
            Complete Your Order
          </a>
        </div>
        
        <!-- Important Notice -->
        <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0; color: #856404;">
            <strong>⏰ Important:</strong> This link expires on ${expiresIn}. 
            After that, your items will be released and you'll need to start over.
          </p>
        </div>
        
        <!-- Help Section -->
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
          <p style="font-size: 14px; color: #6c757d; margin-bottom: 10px;">
            Having trouble? We're here to help!
          </p>
          <p style="font-size: 14px; color: #6c757d; margin: 5px 0;">
            📧 Email: support@jjtextiles.in<br>
            📱 WhatsApp: +91 9876543210<br>
            🕒 Support: 9 AM - 9 PM (Mon-Sat)
          </p>
        </div>
        
      </div>
      
      <!-- Footer -->
      <div style="text-align: center; margin-top: 20px; padding: 20px; color: #6c757d; font-size: 12px;">
        <p>© 2024 Shithaa. All rights reserved.</p>
        <p>This email was sent because you started an order on our website.</p>
      </div>
      
    </body>
    </html>
  `;
};

/**
 * Send order status update email
 */
export const sendOrderStatusUpdate = async (emailData) => {
  const correlationId = `ORDER-UPDATE-${Date.now()}`;
  
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@jjtextiles.in',
      to: emailData.to,
      subject: `Order ${emailData.status} - ${emailData.orderId}`,
      html: generateOrderStatusHTML(emailData)
    };
    
    await transporter.sendMail(mailOptions);
    
    EnhancedLogger.webhookLog('SUCCESS', 'Order status update email sent', {
      correlationId,
      orderId: emailData.orderId,
      email: emailData.to,
      status: emailData.status
    });
    
    return { success: true, correlationId };
    
  } catch (error) {
    EnhancedLogger.webhookLog('ERROR', 'Failed to send order status update email', {
      correlationId,
      orderId: emailData.orderId,
      error: error.message
    });
    
    return { success: false, error: error.message, correlationId };
  }
};

/**
 * Send shipping notification email
 */
export const sendShippingNotification = async (emailData) => {
  const correlationId = `SHIPPING-${Date.now()}`;
  
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@jjtextiles.in',
      to: emailData.to,
      subject: `Your Order Has Shipped - ${emailData.orderId}`,
      html: generateShippingNotificationHTML(emailData)
    };
    
    await transporter.sendMail(mailOptions);
    
    EnhancedLogger.webhookLog('SUCCESS', 'Shipping notification email sent', {
      correlationId,
      orderId: emailData.orderId,
      email: emailData.to,
      trackingNumber: emailData.trackingNumber
    });
    
    return { success: true, correlationId };
    
  } catch (error) {
    EnhancedLogger.webhookLog('ERROR', 'Failed to send shipping notification email', {
      correlationId,
      orderId: emailData.orderId,
      error: error.message
    });
    
    return { success: false, error: error.message, correlationId };
  }
};

/**
 * Send payment failure notification email
 */
export const sendPaymentFailureEmail = async (emailData) => {
  const correlationId = `PAYMENT-FAIL-${Date.now()}`;
  
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@jjtextiles.in',
      to: emailData.to,
      subject: `Payment Failed - Order ${emailData.orderId}`,
      html: generatePaymentFailureHTML(emailData)
    };
    
    await transporter.sendMail(mailOptions);
    
    EnhancedLogger.webhookLog('SUCCESS', 'Payment failure email sent', {
      correlationId,
      orderId: emailData.orderId,
      email: emailData.to,
      declineCode: emailData.declineCode
    });
    
    return { success: true, correlationId };
    
  } catch (error) {
    EnhancedLogger.webhookLog('ERROR', 'Failed to send payment failure email', {
      correlationId,
      orderId: emailData.orderId,
      error: error.message
    });
    
    return { success: false, error: error.message, correlationId };
  }
};

/**
 * Generate HTML for order status update email - Premium Brand Design
 */
const generateOrderStatusHTML = (emailData) => {
  const { orderId, status, amount, items, trackingNumber, estimatedDelivery } = emailData;
  
  const statusMessages = {
    'CONFIRMED': {
      title: 'Order Confirmed ✓',
      message: 'Your order has been confirmed and is being prepared for shipment. We\'ll notify you once it\'s on its way!',
      icon: '✓',
      bgGradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
    },
    'PROCESSING': {
      title: 'Order Processing',
      message: 'Your order is being processed and will be shipped soon. We\'re working hard to get it ready for you!',
      icon: '⚙️',
      bgGradient: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)'
    },
    'SHIPPED': {
      title: 'Order Shipped 🚚',
      message: 'Your order has been shipped and is on its way to you. You can track it using the details below.',
      icon: '🚚',
      bgGradient: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)'
    },
    'DELIVERED': {
      title: 'Order Delivered ✓',
      message: 'Your order has been successfully delivered! We hope you love your purchase. Thank you for shopping with us!',
      icon: '✓',
      bgGradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
    },
    'CANCELLED': {
      title: 'Order Cancelled',
      message: 'Your order has been cancelled as requested. If you have any questions, please contact our support team.',
      icon: '✕',
      bgGradient: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'
    }
  };
  
  const statusInfo = statusMessages[status] || {
    title: 'Order Update',
    message: 'Your order status has been updated.',
    icon: '📦',
    bgGradient: 'linear-gradient(135deg, #473C66 0%, #5a4a7a 100%)'
  };
  
  const itemsHTML = items.map(item => 
    `<tr>
      <td style="padding: 14px; border-bottom: 1px solid #E1D5F6; font-size: 14px; color: #333;">${item.name}</td>
      <td style="padding: 14px; border-bottom: 1px solid #E1D5F6; text-align: center; font-size: 14px; color: #666;">${item.size || '-'}</td>
      <td style="padding: 14px; border-bottom: 1px solid #E1D5F6; text-align: center; font-size: 14px; color: #666;">${item.quantity}</td>
      <td style="padding: 14px; border-bottom: 1px solid #E1D5F6; text-align: right; font-size: 14px; color: #333; font-weight: 600;">₹${item.price}</td>
    </tr>`
  ).join('');
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order ${status} - ${orderId}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #F5F3F9; line-height: 1.6;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F5F3F9; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(71, 60, 102, 0.1);">
              
              <!-- Header with Brand Colors -->
              <tr>
                <td style="background: ${statusInfo.bgGradient}; padding: 40px 30px; text-align: center;">
                  <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #FFFFFF; letter-spacing: -0.5px;">${statusInfo.title}</h1>
                  <p style="margin: 12px 0 0 0; font-size: 16px; color: rgba(255, 255, 255, 0.9); font-weight: 500;">Order #${orderId}</p>
                </td>
              </tr>
              
              <!-- Main Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <p style="margin: 0 0 24px 0; font-size: 16px; color: #333; line-height: 1.7;">${statusInfo.message}</p>
                  
                  ${trackingNumber ? `
                    <div style="background: linear-gradient(135deg, #F5F3F9 0%, #E9E6F2 100%); border: 2px solid #473C66; border-radius: 12px; padding: 24px; margin: 30px 0;">
                      <h3 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 700; color: #473C66;">Tracking Information</h3>
                      <div style="background: #FFFFFF; border-radius: 8px; padding: 16px; margin-bottom: 12px;">
                        <p style="margin: 0 0 8px 0; font-size: 13px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Tracking Number</p>
                        <p style="margin: 0; font-size: 18px; font-weight: 700; color: #473C66; font-family: 'Courier New', monospace; letter-spacing: 1px;">${trackingNumber}</p>
                      </div>
                      ${estimatedDelivery ? `
                        <p style="margin: 0; font-size: 14px; color: #666;">
                          <strong style="color: #473C66;">Estimated Delivery:</strong> ${estimatedDelivery}
                        </p>
                      ` : ''}
                    </div>
                  ` : ''}
                  
                  <!-- Order Summary -->
                  <div style="background: #F9F9F9; border-radius: 12px; padding: 24px; margin: 30px 0;">
                    <h3 style="margin: 0 0 20px 0; font-size: 18px; font-weight: 700; color: #473C66;">Order Summary</h3>
                    
                    <table width="100%" cellpadding="0" cellspacing="0" style="background: #FFFFFF; border-radius: 8px; overflow: hidden;">
                      <thead>
                        <tr style="background: #473C66;">
                          <th style="padding: 14px; text-align: left; color: #FFFFFF; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Item</th>
                          <th style="padding: 14px; text-align: center; color: #FFFFFF; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Size</th>
                          <th style="padding: 14px; text-align: center; color: #FFFFFF; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Qty</th>
                          <th style="padding: 14px; text-align: right; color: #FFFFFF; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${itemsHTML}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colspan="3" style="padding: 16px 14px; text-align: right; font-size: 14px; font-weight: 600; color: #666; border-top: 2px solid #E1D5F6;">Total Amount:</td>
                          <td style="padding: 16px 14px; text-align: right; font-size: 18px; font-weight: 700; color: #473C66; border-top: 2px solid #E1D5F6;">₹${amount}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                  
                  <!-- Help Section -->
                  <div style="background: #F5F3F9; border-radius: 8px; padding: 20px; margin-top: 30px; text-align: center;">
                    <p style="margin: 0 0 8px 0; font-size: 14px; color: #666; font-weight: 600;">Need Help?</p>
                    <p style="margin: 0; font-size: 14px; color: #473C66;">
                      Email: <a href="mailto:info.jjtextiles@gmail.com" style="color: #473C66; text-decoration: underline;">info.jjtextiles@gmail.com</a>
                    </p>
                  </div>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background: #F5F3F9; padding: 24px 30px; text-align: center; border-top: 1px solid #E1D5F6;">
                  <p style="margin: 0; font-size: 12px; color: #999;">
                    <strong style="color: #473C66;">JJTEXTILES</strong> - Quality Clothing for Everyone
                  </p>
                  <p style="margin: 8px 0 0 0; font-size: 11px; color: #BBB;">
                    This is an automated email. Please do not reply directly to this message.
                  </p>
                </td>
              </tr>
              
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

/**
 * Send COD order confirmation email
 */
export const sendCODOrderConfirmationEmail = async (order) => {
  const correlationId = `COD-ORDER-${Date.now()}`;
  
  try {
    console.log('📧 [COD Email] Starting email send process:', {
      correlationId,
      orderId: order.orderId || order._id,
      hasEmail: !!(order.email || order.userInfo?.email || order.shippingInfo?.email)
    });
    
    const transporter = createTransporter();
    
    const shipping = order.shippingInfo || order.address || {};
    const toEmail = order.email || order.userInfo?.email || shipping.email;
    
    if (!toEmail) {
      const errorMsg = 'No recipient email found for COD order confirmation';
      console.error('❌ [COD Email]', errorMsg, {
        correlationId,
        orderId: order.orderId || order._id,
        orderEmail: order.email,
        userInfoEmail: order.userInfo?.email,
        shippingInfoEmail: order.shippingInfo?.email
      });
      throw new Error(errorMsg);
    }

    console.log('📧 [COD Email] Generating invoice PDF...', { correlationId, orderId: order.orderId || order._id });
    
    // Generate invoice PDF
    const { generateInvoiceBuffer } = await import('./invoiceGenerator.js');
    const pdfBuffer = await generateInvoiceBuffer(order);
    
    console.log('📧 [COD Email] PDF generated, preparing email...', {
      correlationId,
      orderId: order.orderId || order._id,
      pdfSize: pdfBuffer.length,
      toEmail
    });
    
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.EMAIL_FROM || 'noreply@jjtextiles.in',
      to: toEmail,
      replyTo: process.env.SUPPORT_EMAIL || process.env.SMTP_USER || process.env.EMAIL_USER || 'jjtex001@gmail.com',
      subject: `Your COD Order Placed - Order #${order.orderId || order._id} | JJTEXTILES`,
      html: generateCODOrderConfirmationHTML(order),
      // Add headers to improve deliverability
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'high',
        'List-Unsubscribe': `<mailto:${process.env.SUPPORT_EMAIL || 'jjtex001@gmail.com'}?subject=Unsubscribe>`,
      },
      // Add text version for better deliverability
      text: `Your COD Order #${order.orderId || order._id} has been placed successfully!\n\n` +
            `Order Amount: ₹${order.total || order.totalPrice || 0}\n` +
            `Payment Method: Cash on Delivery\n\n` +
            `Your order will be confirmed once we receive a call or WhatsApp message confirmation from you.\n` +
            `Please keep your phone available for our team to contact you.\n\n` +
            `Thank you for shopping with JJTEXTILES!\n\n` +
            `Order details are attached in the PDF.`,
      attachments: [
        {
          filename: `Order_${order.orderId || order._id}.pdf`,
          content: pdfBuffer,
        },
      ],
    };
    
    console.log('📧 [COD Email] Sending email via SMTP...', {
      correlationId,
      orderId: order.orderId || order._id,
      from: mailOptions.from,
      to: toEmail,
      hasSMTPConfig: !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
    });
    
    const emailResult = await transporter.sendMail(mailOptions);
    
    console.log('✅ [COD Email] Email sent successfully!', {
      correlationId,
      orderId: order.orderId || order._id,
      email: toEmail,
      messageId: emailResult.messageId,
      response: emailResult.response,
      accepted: emailResult.accepted,
      rejected: emailResult.rejected,
      pending: emailResult.pending,
      envelope: emailResult.envelope
    });
    
    // Log full SMTP response for debugging
    if (emailResult.response) {
      console.log('📧 [COD Email] Full SMTP Response:', emailResult.response);
    }
    
    EnhancedLogger.webhookLog('SUCCESS', 'COD order confirmation email sent', {
      correlationId,
      orderId: order.orderId || order._id,
      email: toEmail,
      messageId: emailResult.messageId
    });
    
    return { success: true, correlationId };
    
  } catch (error) {
    console.error('❌ [COD Email] Failed to send email:', {
      correlationId,
      orderId: order.orderId || order._id,
      error: error.message,
      stack: error.stack,
      hasSMTPConfig: !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS),
      smtpHost: process.env.SMTP_HOST,
      smtpUser: process.env.SMTP_USER ? 'SET' : 'NOT SET',
      smtpPass: process.env.SMTP_PASS ? 'SET' : 'NOT SET'
    });
    
    EnhancedLogger.webhookLog('ERROR', 'Failed to send COD order confirmation email', {
      correlationId,
      orderId: order.orderId || order._id,
      error: error.message
    });
    
    return { success: false, error: error.message, correlationId };
  }
};

/**
 * Generate HTML email template for COD order confirmation
 */
function generateCODOrderConfirmationHTML(order) {
  const shipping = order.shippingInfo || order.address || {};
  const items = order.cartItems || order.items || [];
  
  const itemsHTML = items.map(item => 
    `<tr>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.size || 'N/A'}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">₹${item.price * item.quantity}</td>
    </tr>`
  ).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>COD Order Placed - ${order.orderId}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      
      <!-- Header -->
      <div style="background: #28a745; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">Cash on Delivery Order Placed</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">Order #${order.orderId || order._id}</p>
      </div>
      
      <!-- Main Content -->
      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px;">
        <p style="font-size: 16px; margin-bottom: 20px;">Hi ${shipping.fullName || 'Customer'},</p>
        
        <p style="font-size: 16px; margin-bottom: 20px;">
          Thank you for placing your order with JJTEXTILES! We have received your Cash on Delivery (COD) order request.
        </p>
        
        <!-- Important Notice -->
        <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0; font-weight: bold; color: #856404;">
            ⚠️ Order Confirmation Required
          </p>
          <p style="margin: 10px 0 0 0; color: #856404;">
            Your order will be confirmed once we receive a call or WhatsApp message confirmation from you. 
            Please keep your phone <strong>${shipping.phone || ''}</strong> available for our team to contact you.
          </p>
        </div>
        
        <!-- Order Summary -->
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #007bff;">Order Summary</h3>
          
          <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
            <thead>
              <tr style="background: #f8f9fa;">
                <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Item</th>
                <th style="padding: 12px; text-align: center; border-bottom: 2px solid #dee2e6;">Size</th>
                <th style="padding: 12px; text-align: center; border-bottom: 2px solid #dee2e6;">Qty</th>
                <th style="padding: 12px; text-align: right; border-bottom: 2px solid #dee2e6;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHTML}
            </tbody>
          </table>
          
          <div style="text-align: right; margin-top: 15px; padding-top: 15px; border-top: 2px solid #dee2e6;">
            <p style="margin: 5px 0;"><strong>Subtotal:</strong> ₹${order.subtotal || order.totalPrice || 0}</p>
            ${order.shippingCost ? `<p style="margin: 5px 0;"><strong>Shipping:</strong> ₹${order.shippingCost}</p>` : ''}
            <h3 style="margin: 10px 0 0 0; color: #007bff;">Total: ₹${order.total || order.totalPrice || 0}</h3>
          </div>
        </div>
        
        <!-- Shipping Address -->
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #007bff;">Delivery Address</h3>
          <p style="margin: 5px 0;">${shipping.fullName || ''}</p>
          <p style="margin: 5px 0;">${shipping.addressLine1 || shipping.line1 || ''}</p>
          ${shipping.addressLine2 || shipping.line2 ? `<p style="margin: 5px 0;">${shipping.addressLine2 || shipping.line2}</p>` : ''}
          <p style="margin: 5px 0;">${shipping.city || ''}, ${shipping.state || ''} ${shipping.postalCode || shipping.pincode || ''}</p>
          <p style="margin: 5px 0;"><strong>Phone:</strong> ${shipping.phone || ''}</p>
        </div>
        
        <!-- Next Steps -->
        <div style="background: #e7f3ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #007bff;">What Happens Next?</h3>
          <ol style="padding-left: 20px; margin: 10px 0;">
            <li style="margin: 10px 0;">Our team will call or WhatsApp you to confirm your order</li>
            <li style="margin: 10px 0;">Once confirmed, we will prepare and ship your order</li>
            <li style="margin: 10px 0;">You can pay cash when the order is delivered</li>
          </ol>
        </div>
        
        <!-- Footer -->
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; text-align: center;">
          <p style="font-size: 14px; color: #6c757d; margin: 5px 0;">
            Need help? Contact us at <a href="mailto:info.jjtextiles@gmail.com" style="color: #007bff;">info.jjtextiles@gmail.com</a>
          </p>
          <p style="font-size: 14px; color: #6c757d; margin: 5px 0;">
            WhatsApp: <a href="https://wa.me/919876543210" style="color: #007bff;">+91 9876543210</a>
          </p>
          <p style="font-size: 12px; color: #999; margin-top: 20px;">
            Thank you for shopping with JJTEXTILES!
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate proper tracking URL for different courier partners
 */
const generateTrackingURL = (carrier, trackingNumber) => {
  if (!carrier || !trackingNumber) return null;
  
  const trackingUrls = {
    'DTDC': `https://www.dtdc.in/trace.asp?strCnno=${encodeURIComponent(trackingNumber)}`,
    'ST Courier': `https://stcourier.com/track/shipment?tracking_id=${encodeURIComponent(trackingNumber)}`,
    'XpressBees': `https://www.xpressbees.com/shipment/tracking?awb=${encodeURIComponent(trackingNumber)}`,
    'India Post': `https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx?trackingNumber=${encodeURIComponent(trackingNumber)}`,
    'Delhivery': `https://www.delhivery.com/track/package/${encodeURIComponent(trackingNumber)}`,
    'Blue Dart': `https://www.bluedart.com/tracking?trackingNumber=${encodeURIComponent(trackingNumber)}`,
    'Ecom Express': `https://ecomexpress.in/tracking/?awb_field=${encodeURIComponent(trackingNumber)}`
  };
  
  return trackingUrls[carrier] || null;
};

/**
 * Generate HTML for shipping notification email - Premium Brand Design
 */
const generateShippingNotificationHTML = (emailData) => {
  const { orderId, trackingNumber, carrier, estimatedDelivery, items, amount, trackingURL } = emailData;
  
  // Use provided tracking URL or generate one
  const finalTrackingURL = trackingURL || generateTrackingURL(carrier, trackingNumber);
  
  const itemsHTML = items.map(item => 
    `<tr>
      <td style="padding: 14px; border-bottom: 1px solid #E1D5F6; font-size: 14px; color: #333;">${item.name}</td>
      <td style="padding: 14px; border-bottom: 1px solid #E1D5F6; text-align: center; font-size: 14px; color: #666;">${item.size || '-'}</td>
      <td style="padding: 14px; border-bottom: 1px solid #E1D5F6; text-align: center; font-size: 14px; color: #666;">${item.quantity}</td>
      <td style="padding: 14px; border-bottom: 1px solid #E1D5F6; text-align: right; font-size: 14px; color: #333; font-weight: 600;">₹${item.price}</td>
    </tr>`
  ).join('');
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Order Has Shipped - ${orderId}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #F5F3F9; line-height: 1.6;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F5F3F9; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(71, 60, 102, 0.1);">
              
              <!-- Header with Brand Colors -->
              <tr>
                <td style="background: linear-gradient(135deg, #473C66 0%, #5a4a7a 100%); padding: 40px 30px; text-align: center;">
                  <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #FFFFFF; letter-spacing: -0.5px;">🚚 Your Order Has Shipped!</h1>
                  <p style="margin: 12px 0 0 0; font-size: 16px; color: #B39DDB; font-weight: 500;">Order #${orderId}</p>
                </td>
              </tr>
              
              <!-- Main Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <p style="margin: 0 0 24px 0; font-size: 16px; color: #333; line-height: 1.7;">Great news! Your order is on its way to you. We've packed everything with care and it's now in transit.</p>
                  
                  <!-- Shipping Details Card - Prominent -->
                  <div style="background: linear-gradient(135deg, #F5F3F9 0%, #E9E6F2 100%); border: 2px solid #473C66; border-radius: 12px; padding: 28px; margin: 30px 0; text-align: center;">
                    <div style="margin-bottom: 20px;">
                      <div style="display: inline-block; background: #473C66; color: #FFFFFF; padding: 8px 20px; border-radius: 20px; font-size: 13px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase;">Delivery Partner</div>
                    </div>
                    <h2 style="margin: 12px 0; font-size: 24px; font-weight: 700; color: #473C66;">${carrier || 'Standard Shipping'}</h2>
                    
                    <div style="background: #FFFFFF; border-radius: 8px; padding: 20px; margin: 20px 0;">
                      <p style="margin: 0 0 8px 0; font-size: 13px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Tracking Number</p>
                      <p style="margin: 0; font-size: 20px; font-weight: 700; color: #473C66; font-family: 'Courier New', monospace; letter-spacing: 1px;">${trackingNumber}</p>
                    </div>
                    
                    ${estimatedDelivery ? `
                      <p style="margin: 16px 0 0 0; font-size: 14px; color: #666;">
                        <strong style="color: #473C66;">Estimated Delivery:</strong> ${estimatedDelivery}
                      </p>
                    ` : ''}
                    
                    ${trackingURL ? `
                      <div style="margin-top: 24px;">
                        <a href="${trackingURL}" 
                           target="_blank"
                           style="display: inline-block; background: #473C66; color: #FFFFFF; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 700; box-shadow: 0 4px 12px rgba(71, 60, 102, 0.3); transition: all 0.3s;">
                          📦 Track Your Package Now
                        </a>
                      </div>
                      <p style="margin: 12px 0 0 0; font-size: 12px; color: #999;">Click the button above to track your package on ${carrier}'s website</p>
                    ` : `
                      <div style="margin-top: 24px; padding: 16px; background: #FFF9E6; border-radius: 8px; border-left: 4px solid #FFC107;">
                        <p style="margin: 0; font-size: 14px; color: #856404;">
                          <strong>To track your package:</strong> Visit ${carrier || 'the courier'}'s website and enter tracking number: <strong>${trackingNumber}</strong>
                        </p>
                      </div>
                    `}
                  </div>
                  
                  <!-- Order Items -->
                  <div style="background: #F9F9F9; border-radius: 12px; padding: 24px; margin: 30px 0;">
                    <h3 style="margin: 0 0 20px 0; font-size: 18px; font-weight: 700; color: #473C66;">Order Items</h3>
                    
                    <table width="100%" cellpadding="0" cellspacing="0" style="background: #FFFFFF; border-radius: 8px; overflow: hidden;">
                      <thead>
                        <tr style="background: #473C66;">
                          <th style="padding: 14px; text-align: left; color: #FFFFFF; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Item</th>
                          <th style="padding: 14px; text-align: center; color: #FFFFFF; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Size</th>
                          <th style="padding: 14px; text-align: center; color: #FFFFFF; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Qty</th>
                          <th style="padding: 14px; text-align: right; color: #FFFFFF; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${itemsHTML}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colspan="3" style="padding: 16px 14px; text-align: right; font-size: 14px; font-weight: 600; color: #666; border-top: 2px solid #E1D5F6;">Total Amount:</td>
                          <td style="padding: 16px 14px; text-align: right; font-size: 18px; font-weight: 700; color: #473C66; border-top: 2px solid #E1D5F6;">₹${amount}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                  
                  <!-- Help Section -->
                  <div style="background: #F5F3F9; border-radius: 8px; padding: 20px; margin-top: 30px; text-align: center;">
                    <p style="margin: 0 0 8px 0; font-size: 14px; color: #666; font-weight: 600;">Need Help?</p>
                    <p style="margin: 0; font-size: 14px; color: #473C66;">
                      Email: <a href="mailto:info.jjtextiles@gmail.com" style="color: #473C66; text-decoration: underline;">info.jjtextiles@gmail.com</a>
                    </p>
                  </div>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background: #F5F3F9; padding: 24px 30px; text-align: center; border-top: 1px solid #E1D5F6;">
                  <p style="margin: 0; font-size: 12px; color: #999;">
                    <strong style="color: #473C66;">JJTEXTILES</strong> - Quality Clothing for Everyone
                  </p>
                  <p style="margin: 8px 0 0 0; font-size: 11px; color: #BBB;">
                    This is an automated email. Please do not reply directly to this message.
                  </p>
                </td>
              </tr>
              
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

/**
 * Generate HTML for payment failure email
 */
const generatePaymentFailureHTML = (emailData) => {
  const { orderId, amount, declineInfo, checkoutUrl } = emailData;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Failed - ${orderId}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      
      <div style="background: #dc3545; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">Payment Failed</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">Order #${orderId}</p>
      </div>
      
      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px;">
        <p style="font-size: 16px; margin-bottom: 20px;">Hi there!</p>
        
        <p style="font-size: 16px; margin-bottom: 20px;">
          Your payment for order <strong>#${orderId}</strong> (₹${amount}) failed.
        </p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #dc3545;">${declineInfo.title}</h3>
          <p style="font-size: 16px; margin-bottom: 20px;">${declineInfo.message}</p>
          
          ${declineInfo.retryable ? `
            <div style="text-align: center; margin: 20px 0;">
              <a href="${checkoutUrl}" 
                 style="background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-size: 18px; font-weight: bold; display: inline-block;">
                ${declineInfo.action}
              </a>
            </div>
          ` : `
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px;">
              <p style="margin: 0; color: #856404;">
                <strong>Next Steps:</strong> ${declineInfo.action}
              </p>
            </div>
          `}
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
          <p style="font-size: 14px; color: #6c757d;">
            Need help? Contact us at support@jjtextiles.in or WhatsApp +91 9876543210
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};