"use client"


export default function AboutSection() {
  return (
    <section id="about" className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 font-serif">About JJTEXTILES</h2>
              <div className="space-y-4 text-lg text-gray-600 leading-relaxed">
                <p>
                  At JJTEXTILES, we believe that motherhood should be joyful, not stressful. Our mission is to make
                  maternity wear both elegant and functional so that every mom feels confident and comfortable.
                </p>
                <p>
                  Founded by mothers, for mothers, we understand the unique challenges and beautiful moments of this
                  incredible journey. Every piece in our collection is thoughtfully designed with premium fabrics and
                  innovative features that adapt to your changing body.
                </p>
                <p>
                  From our revolutionary zipless feeding wear to our ultra-soft lounge collections, we're here to
                  support you through every stage of motherhood with style, comfort, and grace.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-pink-400 mb-2">10,000+</div>
                <div className="text-sm text-gray-600">Happy Mothers</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-400 mb-2">50+</div>
                <div className="text-sm text-gray-600">Unique Designs</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
