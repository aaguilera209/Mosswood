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
        <h3 className="text-3xl md:text-4xl font-bold mb-8 leading-tight text-gray-900 dark:text-white">
          We're building a new model for creators.
        </h3>
        <p className="text-xl md:text-2xl text-gray-500 dark:text-gray-400 leading-relaxed font-light">
          Mosswood is where content creators host their work, own their audience, and monetize on their own terms.{' '}
          <span className="text-gray-900 dark:text-white font-medium">No middlemen. No algorithms. Just direct connection.</span>
        </p>
        
        {/* Feature cards */}
        <div className="grid md:grid-cols-3 gap-8 mt-16">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="space-y-4">
                <div className="w-12 h-12 bg-amber-700 bg-opacity-10 dark:bg-amber-300 dark:bg-opacity-10 rounded-xl flex items-center justify-center mx-auto">
                  <Icon className="text-amber-700 dark:text-amber-300 text-xl" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{feature.title}</h4>
                <p className="text-gray-500 dark:text-gray-400">
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
