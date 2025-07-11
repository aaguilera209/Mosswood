import { Upload, DollarSign, Users } from 'lucide-react';

const features = [
  {
    icon: Upload,
    title: "Host",
    description: "Upload and showcase your content on your own branded space"
  },
  {
    icon: DollarSign,
    title: "Sell",
    description: "Set your own prices and keep more of what you earn"
  },
  {
    icon: Users,
    title: "Connect",
    description: "Build direct relationships with your audience"
  }
];

export function MissionSection() {
  return (
    <section className="px-6 py-24">
      <div className="max-w-4xl mx-auto text-center">
        <h3 className="text-3xl md:text-4xl font-bold mb-8 leading-tight text-foreground">
          We're building a new model for creators.
        </h3>
        <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed font-light">
          Mosswood is where content creators host their work, own their audience, and monetize on their own terms.{' '}
          <span className="text-foreground font-medium">No middlemen. No algorithms. Just direct connection.</span>
        </p>
        
        {/* Feature cards */}
        <div className="grid md:grid-cols-3 gap-8 mt-16">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="space-y-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto">
                  <Icon className="text-primary text-xl" />
                </div>
                <h4 className="text-lg font-semibold text-foreground">{feature.title}</h4>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
