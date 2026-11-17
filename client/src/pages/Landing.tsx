import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { Button } from "@/components/ui/button";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Boxes,
  Check,
  CircleDollarSign,
  ClipboardList,
  CookingPot,
  CreditCard,
  Menu,
  PackageCheck,
  ShieldCheck,
  ShoppingCart,
  Store,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import "./landing.css";
import { useLocation } from "wouter";

const productTypes = [
  "Restaurant",
  "Café",
  "Supermarket",
  "Retail",
  "Pharmacy",
  "Electronics",
];

export default function Landing() {
  const auth = useAuth();
  const [, navigate] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const enter = () => (auth.isAuthenticated ? navigate("/app") : startLogin());

  return (
    <div className="mauzo-site">
      <header className="marketing-header">
        <a className="mauzo-wordmark" href="#top" aria-label="Mauzo home">
          <img src="/mauzo-horizontal.png" alt="" />
        </a>
        <nav
          className={`marketing-nav ${menuOpen ? "is-open" : ""}`}
          aria-label="Main navigation"
        >
          <a href="#platform" onClick={() => setMenuOpen(false)}>
            Platform
          </a>
          <a href="#industries" onClick={() => setMenuOpen(false)}>
            Industries
          </a>
          <a href="#how-it-works" onClick={() => setMenuOpen(false)}>
            How it works
          </a>
          <button className="mobile-nav-cta" onClick={enter}>
            {auth.isAuthenticated ? "Open workspace" : "Sign in"}
            <ArrowRight size={15} />
          </button>
        </nav>
        <div className="header-actions">
          <button className="header-login" onClick={enter}>
            {auth.isAuthenticated ? "Open workspace" : "Sign in"}
            <ArrowUpRight size={15} />
          </button>
          <button
            className="mobile-menu"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      <main id="top">
        <section className="mauzo-hero">
          <div className="hero-copy">
            <div className="hero-kicker">
              <span className="kicker-dot" /> THE BUSINESS OPERATING PLATFORM
            </div>
            <h1>
              Make every
              <br />
              sale <em>count.</em>
            </h1>
            <p className="hero-description">
              The clearer way to run your business. Bring sales, stock, orders
              and your team together — all in one flow.
            </p>
            <div className="hero-buttons">
              <Button className="orange-button" onClick={enter}>
                {auth.isAuthenticated
                  ? "Open your workspace"
                  : "Start with Mauzo"}
                <ArrowRight size={17} />
              </Button>
              <a href="#platform" className="text-link">
                Explore the platform <ArrowDown size={15} />
              </a>
            </div>
            <div className="hero-trust">
              <ShieldCheck size={16} />
              <span>Built for independent businesses and growing teams</span>
            </div>
          </div>
          <div
            className="hero-art"
            aria-label="Mauzo brings point of sale and inventory into one workspace"
          >
            <div className="hero-sun" />
            <div className="hero-orbit orbit-one" />
            <div className="hero-orbit orbit-two" />
            <div className="receipt-card">
              <div className="receipt-top">
                <div className="receipt-brand">
                  <span className="receipt-monogram">M</span>
                  <span>
                    <b>mauzo</b>
                    <small>YOUR BUSINESS, IN FLOW</small>
                  </span>
                </div>
                <span className="receipt-status">
                  <i /> READY
                </span>
              </div>
              <div className="receipt-rule" />
              <div className="receipt-row">
                <span>
                  <ShoppingCart />
                  Point of sale
                </span>
                <ArrowUpRight />
              </div>
              <div className="receipt-row">
                <span>
                  <Boxes />
                  Inventory
                </span>
                <ArrowUpRight />
              </div>
              <div className="receipt-row">
                <span>
                  <ClipboardList />
                  Orders & fulfilment
                </span>
                <ArrowUpRight />
              </div>
              <div className="receipt-rule" />
              <div className="receipt-bottom">
                <span>One workspace.</span>
                <b>Many ways to trade.</b>
              </div>
            </div>
            <div className="art-caption">
              <span>01</span> THE EVERYDAY WORK, CONNECTED
            </div>
            <span className="art-spark spark-a">✳</span>
            <span className="art-spark spark-b">✳</span>
          </div>
          <div className="hero-side-note">
            SALES <span>·</span> STOCK <span>·</span> TEAM
          </div>
        </section>

        <section className="proof-strip">
          <p>MADE FOR THE WAY YOU DO BUSINESS</p>
          <div>
            {productTypes.map((type, index) => (
              <span key={type}>
                {index > 0 && <i />}
                {type}
              </span>
            ))}
          </div>
        </section>

        <section className="platform-section" id="platform">
          <div className="section-intro">
            <span className="section-index">01 / THE PLATFORM</span>
            <div>
              <h2>
                From first sale
                <br />
                to <em>full picture.</em>
              </h2>
              <p>
                Less switching between tools. More confidence at the counter and
                behind it. Mauzo brings the moving parts of daily business into
                one connected workspace.
              </p>
            </div>
          </div>
          <div className="feature-ledger">
            <article className="feature-card feature-large">
              <div className="feature-illustration pos-illustration">
                <div className="illustration-top">
                  <span className="tiny-mark">M</span>
                  <span>POINT OF SALE</span>
                  <span className="ill-live">
                    <i /> READY
                  </span>
                </div>
                <div className="ill-divider" />
                <div className="ill-item">
                  <span className="ill-glyph orange-glyph">
                    <ShoppingCart />
                  </span>
                  <span>
                    <b>Fast, clear checkout</b>
                    <small>Keep the counter moving</small>
                  </span>
                  <ArrowUpRight />
                </div>
                <div className="ill-item">
                  <span className="ill-glyph sand-glyph">
                    <CreditCard />
                  </span>
                  <span>
                    <b>Checkout that fits your flow</b>
                    <small>Cash today · more payment options planned</small>
                  </span>
                  <ArrowUpRight />
                </div>
              </div>
              <div className="feature-copy">
                <span className="feature-number">01</span>
                <div>
                  <h3>A better point of sale.</h3>
                  <p>
                    Make checkout feel straightforward, from a quick counter
                    sale to a food order that needs a little more attention.
                  </p>
                </div>
              </div>
            </article>
            <article className="feature-card">
              <div className="feature-illustration stock-illustration">
                <div className="stock-heading">
                  <Boxes />
                  <span>INVENTORY</span>
                </div>
                <div className="stock-lines">
                  <i />
                  <i />
                  <i />
                </div>
                <div className="stock-foot">
                  <span>PRODUCTS</span>
                  <span>BRANCH STOCK</span>
                </div>
              </div>
              <div className="feature-copy">
                <span className="feature-number">02</span>
                <div>
                  <h3>Know what’s on hand.</h3>
                  <p>
                    Keep your product list, branch stock and movements in one
                    place.
                  </p>
                </div>
              </div>
            </article>
            <article className="feature-card">
              <div className="feature-illustration team-illustration">
                <div className="team-symbol">
                  <Users />
                  <span>
                    <Check />
                  </span>
                </div>
                <div className="team-lines">
                  <b>One business</b>
                  <i />
                  <i />
                  <small>Clear roles. Shared rhythm.</small>
                </div>
                <div className="team-orbit" />
              </div>
              <div className="feature-copy">
                <span className="feature-number">03</span>
                <div>
                  <h3>Give everyone their part.</h3>
                  <p>
                    Set up owner, cashier, kitchen and store roles with access
                    shaped around the work.
                  </p>
                </div>
              </div>
            </article>
            <article className="feature-card feature-wide">
              <div className="feature-illustration flow-illustration">
                <span className="flow-node">
                  <Store />
                </span>
                <i />
                <span className="flow-node active">
                  <CircleDollarSign />
                </span>
                <i />
                <span className="flow-node">
                  <PackageCheck />
                </span>
                <i />
                <span className="flow-node">
                  <BarChart3 />
                </span>
                <div className="flow-labels">
                  <small>BRANCH</small>
                  <small>SALE</small>
                  <small>STOCK</small>
                  <small>INSIGHT</small>
                </div>
              </div>
              <div className="feature-copy">
                <span className="feature-number">04</span>
                <div>
                  <h3>A connected view as you grow.</h3>
                  <p>
                    Follow the work from branch to sale to stock, and see the
                    bigger picture in business reports.
                  </p>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section className="industry-section" id="industries">
          <div className="industry-inner">
            <div className="industry-copy">
              <span className="section-index">02 / YOUR KIND OF BUSINESS</span>
              <h2>
                One platform.
                <br />
                <em>Your way of trading.</em>
              </h2>
              <p>
                Start with your industry. Mauzo configures a useful set of
                modules for the way you work, and leaves room to shape your
                workspace as the business changes.
              </p>
              <a href="#how-it-works" className="text-link">
                See how setup works <ArrowRight size={15} />
              </a>
            </div>
            <div className="industry-list">
              {[
                {
                  name: "Food & hospitality",
                  type: "Restaurants · Cafés",
                  icon: CookingPot,
                },
                {
                  name: "Retail & everyday goods",
                  type: "Retail · Supermarkets",
                  icon: ShoppingCart,
                },
                {
                  name: "Specialist stores",
                  type: "Pharmacies · Electronics · More",
                  icon: PackageCheck,
                },
              ].map((item, index) => (
                <div className="industry-row" key={item.name}>
                  <span className="industry-row-num">0{index + 1}</span>
                  <span className="industry-row-icon">
                    <item.icon />
                  </span>
                  <span className="industry-row-copy">
                    <b>{item.name}</b>
                    <small>{item.type}</small>
                  </span>
                  <ArrowUpRight className="industry-arrow" />
                </div>
              ))}
            </div>
          </div>
          <div className="industry-word">
            MAUZO <span>·</span> MADE TO ADAPT
          </div>
        </section>

        <section className="how-section" id="how-it-works">
          <div className="how-heading">
            <span className="section-index">03 / A SIMPLE START</span>
            <h2>
              Set up for <em>your work.</em>
            </h2>
            <p>
              Your workspace begins with the business you run — not a
              one-size-fits-all template.
            </p>
          </div>
          <div className="steps-row">
            <article>
              <span>01</span>
              <div className="step-symbol">
                <Store />
              </div>
              <h3>Choose your business type</h3>
              <p>
                Tell Mauzo what you do and start with the right set of tools.
              </p>
            </article>
            <article>
              <span>02</span>
              <div className="step-symbol">
                <Boxes />
              </div>
              <h3>Set up your workspace</h3>
              <p>Add a branch, products and the people who help run the day.</p>
            </article>
            <article>
              <span>03</span>
              <div className="step-symbol">
                <CircleDollarSign />
              </div>
              <h3>Get on with business</h3>
              <p>
                Make sales, keep stock in view and learn from what’s happening.
              </p>
            </article>
          </div>
        </section>

        <section className="mauzo-cta">
          <div className="cta-orb" />
          <span className="section-index">
            GOOD BUSINESS STARTS WITH A CLEAR VIEW
          </span>
          <h2>
            Bring your business
            <br />
            into <em>one flow.</em>
          </h2>
          <p>
            Set up your Mauzo workspace and make the next sale a little simpler.
          </p>
          <Button className="cta-button" onClick={enter}>
            {auth.isAuthenticated
              ? "Open your workspace"
              : "Get started with Mauzo"}
            <ArrowRight size={17} />
          </Button>
          <span className="cta-signoff">SALES · STOCK · TEAM · INSIGHT</span>
        </section>
      </main>

      <footer className="marketing-footer">
        <a
          className="mauzo-wordmark footer-wordmark"
          href="#top"
          aria-label="Mauzo home"
        >
          <img src="/mauzo-horizontal.png" alt="" />
        </a>
        <span className="footer-line">A clearer way to run your business.</span>
        <div>
          <a href="#platform">Platform</a>
          <a href="#industries">Industries</a>
          <a href="#how-it-works">How it works</a>
          <button onClick={enter}>
            {auth.isAuthenticated ? "Workspace" : "Sign in"}
          </button>
        </div>
        <small>
          © {new Date().getFullYear()} Mauzo. Your business, in flow.
        </small>
      </footer>
    </div>
  );
}
