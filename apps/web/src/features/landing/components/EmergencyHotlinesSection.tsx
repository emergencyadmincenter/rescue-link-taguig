const hotlines = [
  {
    name: "Taguig Command Center",
    description: "Taguig City centralized emergency response",
    number: "0919-079-9286\n(02) 8789-3200",
    image: "/images/cc-taguig-building.jpg",
    is247: true,
  },
  {
    name: "PNP Taguig",
    description: "Taguig Police Station assistance",
    number: "(02) 8642-3582\n0998-598-7932",
    image: "/images/pnp-taguig.jpg",
    is247: true,
  },
  {
    name: "BFP Taguig",
    description: "Taguig Fire Station",
    number: "(02) 8837-0740\n0906-211-0919",
    image: "/images/bfp-taguig.jpg",
    is247: true,
  },
  {
    name: "Taguig Rescue",
    description: "Medical emergencies and ambulance",
    number: "0919-070-3112\n0919-079-9112",
    image: "/images/rescue-taguig.jpg",
    is247: true,
  },
  {
    name: "Taguig CDRRMO",
    description: "Taguig Disaster Risk Reduction",
    number: "(02) 7795-9932\n0919-070-3112",
    image: "/images/cdrrmo-taguig.jpg",
    is247: true,
  },
  {
    name: "R.E.A.C.T.",
    description: "Roadside Emergency Assistance",
    number: "(02) 8640-7006\n0929-631-5924",
    image: "/images/taguig-react.jpg",
    is247: true,
  },
];

export function EmergencyHotlinesSection() {
  return (
    <section
      id="hotlines"
      className="py-12 bg-white relative overflow-hidden border-b border-gray-100 lg:py-24"
    >
      <div className="max-w-[1400px] mx-auto px-6 md:px-8 lg:px-12 relative z-10">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-20">
          <div className="w-full lg:w-[35%] lg:sticky lg:top-32 h-fit">
            <h2 className="title-large text-primary mb-3">
              Emergency Directory
            </h2>
            <h3 className="font-outfit font-bold text-4xl md:text-5xl text-gray-900 mb-6 tracking-tight">
              Direct Access to Help
            </h3>
            <p className="text-lg md:text-xl text-gray-600 leading-relaxed mb-10">
              Quickly access important emergency contacts whenever immediate
              assistance is needed. Keep these numbers handy for critical
              situations.
            </p>
          </div>

          <div className="w-full lg:w-[65%] grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-5">
            {hotlines.map((hotline) => (
              <div
                key={hotline.name}
                className="flex flex-col justify-between rounded-2xl bg-cover bg-center bg-no-repeat p-6"
                style={{
                  backgroundImage: `linear-gradient(to right, rgba(220, 38, 38, 0.95) 70%, rgba(220, 38, 38, 0.5)), url("${hotline.image}")`,
                }}
              >
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="title-medium text-info-foreground text-shadow-lg">
                      {hotline.name}
                    </h4>
                    {hotline.is247 && (
                      <span className="px-2.5 py-1 bg-white text-gray-600 text-[10px] font-bold rounded-full uppercase tracking-wider shadow-sm border border-gray-100">
                        24/7
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-info-foreground mb-6">
                    {hotline.description}
                  </p>
                </div>

                <div className="flex flex-col gap-1">
                  {hotline.number.split("\n").map((num, i) => (
                    <a
                      key={i}
                      href={`tel:${num.replace(/[^0-9]/g, "")}`}
                      className="text-shadow-lg text-lg md:text-xl text-info-foreground tracking-tight hover:text-primary transition-colors"
                    >
                      {num}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
