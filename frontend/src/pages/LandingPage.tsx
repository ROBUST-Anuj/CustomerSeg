import React from 'react';
import { Link } from 'react-router-dom';
import {
  BrainCircuit,
  ArrowRight,
  Database,
  BarChart3,
  Layers,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  BookOpen,
  GraduationCap,
  Users,
  Target,
  Code2
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Academic Banner */}
      <div className="bg-indigo-900 text-indigo-100 text-xs py-2 px-4 border-b border-indigo-800 text-center font-medium flex items-center justify-center space-x-2">
        <GraduationCap size={15} className="text-indigo-300" />
        <span>IPS Academy, Institute of Engineering and Science, Indore &bull; Department of Computer Science & Engineering (2026–27)</span>
      </div>

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-600 flex items-center justify-center text-white font-black shadow-md shadow-indigo-100">
              CS
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg text-slate-900 tracking-tight leading-tight">CustomerSeg</span>
              <span className="text-[10px] text-indigo-600 font-semibold tracking-wider uppercase">AI Analytics Platform</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-indigo-600 transition-colors">Features</a>
            <a href="#workflow" className="hover:text-indigo-600 transition-colors">How It Works</a>
            <a href="#technology" className="hover:text-indigo-600 transition-colors">Technology</a>
            <a href="#about" className="hover:text-indigo-600 transition-colors">About Project</a>
            <a href="#references" className="hover:text-indigo-600 transition-colors">References</a>
          </nav>

          <div className="flex items-center space-x-3">
            <Link
              to="/login"
              className="text-sm font-medium text-slate-700 hover:text-indigo-600 px-3 py-2 rounded-lg transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/dashboard"
              className="text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg shadow-sm hover:shadow transition-all flex items-center space-x-1"
            >
              <span>Explore Dashboard</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-16 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-6 animate-pulse">
          <Sparkles size={14} />
          <span>AI-Powered Customer Segmentation & Management System</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15] max-w-4xl mx-auto">
          Turn Customer Data Into <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-600">Actionable Intelligence</span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
          Discover meaningful customer segments, understand customer behavior, and make smarter, data-driven marketing decisions with AI-powered analytics.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/dashboard"
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-base shadow-lg shadow-indigo-100 hover:shadow-indigo-200 transition-all flex items-center justify-center space-x-2"
          >
            <span>Explore Dashboard</span>
            <ArrowRight size={18} />
          </Link>
          <a
            href="#workflow"
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-base transition-colors flex items-center justify-center"
          >
            See How It Works
          </a>
        </div>

        {/* Dashboard Preview Mockup Card */}
        <div className="mt-14 max-w-5xl mx-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl shadow-slate-200">
          <div className="rounded-xl bg-slate-900 p-4 sm:p-6 text-left">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span>
                <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
                <span className="text-xs text-slate-400 font-mono ml-2">CustomerSeg Executive Studio — v1.0.0</span>
              </div>
              <span className="text-xs bg-indigo-500/20 text-indigo-300 font-medium px-2 py-0.5 rounded border border-indigo-500/30">
                Live Data Active
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/60">
                <p className="text-xs text-slate-400 font-medium">Total Customers</p>
                <p className="text-2xl font-bold text-white mt-1">250</p>
                <p className="text-[11px] text-emerald-400 mt-1">&uarr; Validated Active</p>
              </div>
              <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/60">
                <p className="text-xs text-slate-400 font-medium">Distinct Segments</p>
                <p className="text-2xl font-bold text-white mt-1">5 Clusters</p>
                <p className="text-[11px] text-indigo-400 mt-1">K-Means (k=5)</p>
              </div>
              <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/60">
                <p className="text-xs text-slate-400 font-medium">Silhouette Score</p>
                <p className="text-2xl font-bold text-white mt-1">0.5482</p>
                <p className="text-[11px] text-emerald-400 mt-1">Strong Partition</p>
              </div>
              <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/60">
                <p className="text-xs text-slate-400 font-medium">High-Value Cohort</p>
                <p className="text-2xl font-bold text-white mt-1">26.0%</p>
                <p className="text-[11px] text-amber-400 mt-1">Affluent Spenders</p>
              </div>
            </div>

            <div className="mt-4 p-4 bg-slate-800/40 rounded-xl border border-slate-700/40 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-300 gap-2">
              <div className="flex items-center space-x-2">
                <BrainCircuit size={16} className="text-indigo-400" />
                <span>Model: StandardScaler + K-Means + Decision Tree Partition Rules + 2D PCA Coordinates</span>
              </div>
              <Link to="/segmentation" className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center space-x-1">
                <span>Launch Segmentation Studio</span>
                <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Six-Step Workflow Section */}
      <section id="workflow" className="py-20 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-xs font-bold text-indigo-600 tracking-wider uppercase">System Architecture</h2>
            <h3 className="text-3xl font-extrabold text-slate-900 mt-2">Six-Step Segmentation Workflow</h3>
            <p className="mt-3 text-slate-600">
              A transparent, end-to-end data pipeline transforming raw customer records into validated strategic segments.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                step: '01',
                title: 'Upload Dataset',
                desc: 'Upload CSV datasets with automatic row and column detection, format checking, and missing value audits.',
                icon: Database
              },
              {
                step: '02',
                title: 'Configure Columns',
                desc: 'Map customer identifiers, demographic features, spending indices, and select active features for unsupervised modeling.',
                icon: Layers
              },
              {
                step: '03',
                title: 'Prepare Data',
                desc: 'Apply configurable missing value imputation (mean/median/drop) and robust feature scaling (StandardScaler/MinMax).',
                icon: CheckCircle2
              },
              {
                step: '04',
                title: 'Configure Algorithm',
                desc: 'Tune K-Means cluster count with automated Elbow-method analysis and mathematical Silhouette score verification.',
                icon: BrainCircuit
              },
              {
                step: '05',
                title: 'Run Segmentation',
                desc: 'Execute clustering on the Python ML service, calculate 2D PCA projection coordinates, and extract Decision Tree rules.',
                icon: Sparkles
              },
              {
                step: '06',
                title: 'Targeted Campaigns',
                desc: 'Translate cluster centroids into actionable segment personas and draft personalized marketing campaigns.',
                icon: Target
              }
            ].map((s, idx) => {
              const Icon = s.icon;
              return (
                <div key={idx} className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs hover:border-indigo-300 transition-colors">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-10 w-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                      <Icon size={20} />
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-400">{s.step}</span>
                  </div>
                  <h4 className="text-lg font-bold text-slate-900">{s.title}</h4>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">{s.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Technology Stack Section */}
      <section id="technology" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-xs font-bold text-indigo-600 tracking-wider uppercase">Engineered for Scale</h2>
          <h3 className="text-3xl font-extrabold text-slate-900 mt-2">Technology Stack & Architecture</h3>
          <p className="mt-3 text-slate-600">
            Decoupled microservice architecture separating interactive analytics, secure business logic, and scientific computing.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="p-6 rounded-xl border border-slate-200 bg-white">
            <h4 className="font-bold text-slate-900 text-lg mb-2">Frontend</h4>
            <ul className="text-sm text-slate-600 space-y-2">
              <li>&bull; React 18 & Vite</li>
              <li>&bull; Tailwind CSS</li>
              <li>&bull; Recharts Visualizations</li>
              <li>&bull; Lucide React Icons</li>
              <li>&bull; React Router DOM</li>
            </ul>
          </div>
          <div className="p-6 rounded-xl border border-slate-200 bg-white">
            <h4 className="font-bold text-slate-900 text-lg mb-2">Backend API</h4>
            <ul className="text-sm text-slate-600 space-y-2">
              <li>&bull; Node.js & Express</li>
              <li>&bull; RESTful API (v1)</li>
              <li>&bull; JWT Authentication & RBAC</li>
              <li>&bull; Helmet & Rate Limiting</li>
              <li>&bull; CSV Stream Parsing</li>
            </ul>
          </div>
          <div className="p-6 rounded-xl border border-slate-200 bg-white">
            <h4 className="font-bold text-slate-900 text-lg mb-2">Database</h4>
            <ul className="text-sm text-slate-600 space-y-2">
              <li>&bull; MySQL Database</li>
              <li>&bull; Knex Query Builder</li>
              <li>&bull; Relational Schema & Indexes</li>
              <li>&bull; Audit Event Logging</li>
              <li>&bull; SQLite Dev Mode</li>
            </ul>
          </div>
          <div className="p-6 rounded-xl border border-slate-200 bg-white">
            <h4 className="font-bold text-slate-900 text-lg mb-2">Machine Learning</h4>
            <ul className="text-sm text-slate-600 space-y-2">
              <li>&bull; Python FastAPI Microservice</li>
              <li>&bull; Scikit-Learn K-Means</li>
              <li>&bull; PCA 2D Dimensionality</li>
              <li>&bull; Decision Tree Rule Extraction</li>
              <li>&bull; Silhouette & Elbow Curves</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Academic Project Presentation Section */}
      <section id="about" className="py-16 bg-indigo-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-800 text-indigo-200 text-xs font-semibold mb-4">
                <GraduationCap size={15} />
                <span>Academic Project Presentation</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                AI-Powered Customer Segmentation & Management System
              </h3>
              <p className="mt-3 text-indigo-200 text-sm leading-relaxed">
                Developed as a comprehensive engineering mini-project addressing modern algorithmic customer analytics, unsupervised machine learning, and relational marketing systems.
              </p>

              <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                <div className="bg-indigo-900/60 p-3.5 rounded-lg border border-indigo-800">
                  <span className="text-xs text-indigo-300 block">Institution</span>
                  <span className="font-semibold text-white">IPS Academy, Indore</span>
                  <span className="text-xs text-indigo-400 block mt-0.5">Dept. of Computer Science & Engineering</span>
                </div>
                <div className="bg-indigo-900/60 p-3.5 rounded-lg border border-indigo-800">
                  <span className="text-xs text-indigo-300 block">Academic Year</span>
                  <span className="font-semibold text-white">2026–27</span>
                  <span className="text-xs text-indigo-400 block mt-0.5">Degree Capstone Project</span>
                </div>
                <div className="bg-indigo-900/60 p-3.5 rounded-lg border border-indigo-800">
                  <span className="text-xs text-indigo-300 block">Project Guide</span>
                  <span className="font-semibold text-white">Ms. Arpita Bhatia</span>
                  <span className="text-xs text-indigo-400 block mt-0.5">Faculty, CSE Department</span>
                </div>
                <div className="bg-indigo-900/60 p-3.5 rounded-lg border border-indigo-800">
                  <span className="text-xs text-indigo-300 block">Presented By</span>
                  <span className="font-semibold text-white">Avani Gupta</span>
                  <span className="text-xs text-indigo-400 block mt-0.5">Student Developer & Researcher</span>
                </div>
              </div>
            </div>

            <div className="bg-indigo-900/40 p-6 rounded-2xl border border-indigo-800 text-sm space-y-4">
              <h4 className="font-bold text-white text-base flex items-center space-x-2">
                <BookOpen size={18} className="text-indigo-400" />
                <span>Project Objectives & Scope</span>
              </h4>
              <p className="text-indigo-200 text-xs leading-relaxed">
                1. <strong>Algorithmic Grouping:</strong> Replace subjective customer categorization with mathematically validated unsupervised clustering.
              </p>
              <p className="text-indigo-200 text-xs leading-relaxed">
                2. <strong>Explainable AI:</strong> Leverage Decision Tree classification rules to transform abstract K-Means clusters into explicit, interpretable business rules.
              </p>
              <p className="text-indigo-200 text-xs leading-relaxed">
                3. <strong>Operational Personalization:</strong> Connect quantitative analytical profiles directly to actionable marketing campaign workflows and audience calculators.
              </p>
              <div className="pt-2 border-t border-indigo-800">
                <p className="text-xs text-indigo-300">
                  <strong>Limitations & Future Scope:</strong> Current clustering executes on batch datasets. Future extensions include real-time event streaming via Apache Kafka, automated Bayesian hyperparameter tuning, and cross-channel attribution modeling.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* References Section */}
      <section id="references" className="py-16 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center space-x-2">
            <BookOpen size={20} className="text-indigo-600" />
            <span>Academic & Technical References</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <a href="https://scikit-learn.org/" target="_blank" rel="noreferrer" className="p-3 bg-white rounded-lg border border-slate-200 hover:border-indigo-400 transition-colors block">
              <span className="font-bold text-slate-900">Scikit-learn Documentation</span>
              <p className="text-slate-500 mt-1">K-Means, PCA, and Silhouette Score API guides.</p>
            </a>
            <a href="https://react.dev/" target="_blank" rel="noreferrer" className="p-3 bg-white rounded-lg border border-slate-200 hover:border-indigo-400 transition-colors block">
              <span className="font-bold text-slate-900">React.js Official Documentation</span>
              <p className="text-slate-500 mt-1">Modern component patterns and state architecture.</p>
            </a>
            <a href="https://dev.mysql.com/doc/" target="_blank" rel="noreferrer" className="p-3 bg-white rounded-lg border border-slate-200 hover:border-indigo-400 transition-colors block">
              <span className="font-bold text-slate-900">MySQL Reference Manual</span>
              <p className="text-slate-500 mt-1">Relational schema design and indexing optimization.</p>
            </a>
            <div className="p-3 bg-white rounded-lg border border-slate-200 block">
              <span className="font-bold text-slate-900">HBR & McKinsey Analytics Insights</span>
              <p className="text-slate-500 mt-1">Customer segmentation frameworks and data-driven marketing value.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-10 px-4 text-center text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <div className="h-6 w-6 rounded bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">
              CS
            </div>
            <span className="font-semibold text-white">CustomerSeg</span>
            <span>&mdash; IPS Academy Indore (2026–27)</span>
          </div>
          <div className="flex space-x-6">
            <Link to="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
            <Link to="/segmentation" className="hover:text-white transition-colors">Segmentation</Link>
            <Link to="/customers" className="hover:text-white transition-colors">Customers</Link>
            <Link to="/login" className="hover:text-white transition-colors">Sign In</Link>
          </div>
          <p>&copy; 2026–2027 CustomerSeg. Project Guide: Ms. Arpita Bhatia | Presented by: Avani Gupta.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
