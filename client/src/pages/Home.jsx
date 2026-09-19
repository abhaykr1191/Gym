import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';

const plans = [
  { name: 'Basic', price: 29, perks: ['Gym floor access', 'Locker room', '1 group class / week'] },
  { name: 'Premium', price: 59, perks: ['24/7 access', 'All group classes', 'Sauna & recovery zone'], featured: true },
  { name: 'Elite', price: 99, perks: ['Everything in Premium', 'Nutrition plan', '2 PT sessions / month'] },
];

const classes = [
  { name: 'Strength Lab', time: 'Mon / Wed / Fri · 6:00am' },
  { name: 'HIIT Burn', time: 'Tue / Thu · 7:00pm' },
  { name: 'Yoga & Mobility', time: 'Sat · 9:00am' },
  { name: 'Powerlifting Club', time: 'Sun · 10:00am' },
];

export default function Home() {
  const { user } = useAuth();
  const ctaTo = user ? (user.role === 'owner' ? '/dashboard' : '/portal') : '/register';

  return (
    <div className="home">
      <section className="hero">
        <div>
          <p className="eyebrow">Train with intent</p>
          <h1>Your strongest year starts at Ironhouse.</h1>
          <p className="lede">
            Modern equipment, coached programming, and personal trainers matched to your goals and your budget — you name the
            price per session, we assign the right coach.
          </p>
          <div className="hero-actions">
            <Link className="btn large" to={ctaTo}>
              {user ? 'Go to my area' : 'Start your membership'}
            </Link>
            <Link className="btn ghost large" to={user ? '/portal' : '/login'}>
              Request a trainer
            </Link>
          </div>
        </div>
        <div className="hero-stats">
          <div>
            <strong>12</strong>
            <span>certified coaches</span>
          </div>
          <div>
            <strong>40+</strong>
            <span>classes weekly</span>
          </div>
          <div>
            <strong>5am–11pm</strong>
            <span>open daily</span>
          </div>
        </div>
      </section>

      <section className="section">
        <h2>Memberships</h2>
        <div className="plan-grid">
          {plans.map((plan) => (
            <article key={plan.name} className={`plan ${plan.featured ? 'featured' : ''}`}>
              <h3>{plan.name}</h3>
              <p className="price">
                ${plan.price}
                <span>/mo</span>
              </p>
              <ul>
                {plan.perks.map((perk) => (
                  <li key={perk}>{perk}</li>
                ))}
              </ul>
              <Link className="btn block" to={`/register?plan=${encodeURIComponent(plan.name)}`}>
                Choose {plan.name}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <h2>Weekly classes</h2>
        <div className="class-grid">
          {classes.map((item) => (
            <div key={item.name} className="class-card">
              <h3>{item.name}</h3>
              <p>{item.time}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section band">
        <h2>How personal training works</h2>
        <ol className="steps">
          <li>
            <strong>1. Tell us your goal</strong>
            <p>Pick your focus, weekly frequency, and preferred time slot from your member portal.</p>
          </li>
          <li>
            <strong>2. Name your price</strong>
            <p>You set the per-session price you are comfortable paying for a trainer.</p>
          </li>
          <li>
            <strong>3. We assign your coach</strong>
            <p>The gym owner reviews your request, confirms the rate, and assigns a matching trainer.</p>
          </li>
        </ol>
      </section>
    </div>
  );
}
