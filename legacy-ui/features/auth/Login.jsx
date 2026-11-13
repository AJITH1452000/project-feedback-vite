import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, MessageSquareText, Quote, Sparkles, Star } from 'lucide-react';
import './login.css';

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  function continueToWorkspace(event) {
    event.preventDefault();
    navigate('/');
  }

  return (
    <main className="login-page">
      <section className="login-showcase" aria-label="About ProFeed">
        <div className="login-showcase-inner">
          <a className="login-brand" href="/" aria-label="ProFeed home">
            <span className="login-brand-mark"><MessageSquareText size={20} /></span>
            <span>ProFeed<small>PROJECT FEEDBACK</small></span>
          </a>

          <div className="showcase-copy">
            <span className="showcase-kicker"><Sparkles size={14} /> BETTER TEAMS START HERE</span>
            <h1>Make every<br />conversation <span>count.</span></h1>
            <p>Bring your projects and people together with feedback that moves great work forward.</p>
          </div>

          <div className="showcase-preview">
            <div className="preview-topline">
              <span><i /> A little team appreciation</span>
              <span className="preview-category">TEAMWORK</span>
            </div>
            <div className="preview-quote-mark"><Quote size={21} fill="currentColor" /></div>
            <blockquote>“Great collaboration and clear communication throughout the sprint. The new property flow feels much more intuitive.”</blockquote>
            <div className="preview-rating" aria-label="5 out of 5 stars">
              {Array.from({ length: 5 }, (_, index) => <Star key={index} size={13} fill="currentColor" />)}
            </div>
            <div className="preview-bottomline">
              <span className="preview-author"><i>PS</i><span><strong>Priya Sharma</strong><small>Product designer · Retrex Platform</small></span></span>
              <span className="preview-appreciation"><Sparkles size={14} /> Helpful</span>
            </div>
          </div>
          <div className="showcase-note"><span className="note-avatars"><i>JD</i><i>AL</i><i>MK</i></span><span>Good work gets better together.</span></div>
        </div>
        <div className="showcase-orb showcase-orb-one" />
        <div className="showcase-orb showcase-orb-two" />
      </section>

      <section className="login-panel">
        <div className="login-panel-top"><span>New to ProFeed?</span><a href="#demo-access" onClick={event => { event.preventDefault(); navigate('/'); }}>Explore the demo <ArrowRight size={14} /></a></div>
        <div className="login-form-wrap">
          <div className="login-heading">
            <span className="login-heading-icon"><MessageSquareText size={19} /></span>
            <div className="login-eyebrow">WELCOME BACK</div>
            <h2>Sign in to your<br />workspace</h2>
            <p>Pick up where your team left off.</p>
          </div>

          <form className="login-form" onSubmit={continueToWorkspace}>
            <label htmlFor="login-email">Work email</label>
            <input id="login-email" name="email" type="email" placeholder="you@company.com" autoComplete="email" required />

            <div className="login-password-label">
              <label htmlFor="login-password">Password</label>
              <button type="button" onClick={() => window.alert('Password recovery is not available in this demo.')}>Forgot password?</button>
            </div>
            <div className="login-password-field">
              <input id="login-password" name="password" type={showPassword ? 'text' : 'password'} placeholder="Enter your password" autoComplete="current-password" required />
              <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(value => !value)}>
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>

            <label className="login-remember"><input type="checkbox" name="remember" /> <span>Keep me signed in</span></label>
            <button className="login-submit" type="submit">Continue to workspace <ArrowRight size={17} /></button>
          </form>

          <div className="login-demo-note" id="demo-access"><span>i</span><p><strong>Demo preview</strong> — authentication isn't connected yet. Any valid email and password will open the workspace.</p></div>
          <p className="login-terms">By continuing, you agree to our <a href="#terms">Terms</a> and <a href="#privacy">Privacy Policy</a>.</p>
        </div>
        <div className="login-footer"><span>© 2026 ProFeed</span><span>Made for teams that care <b>✦</b></span></div>
      </section>
    </main>
  );
}
