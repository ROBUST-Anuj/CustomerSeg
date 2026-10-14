import React from 'react';
import { BookOpen, BrainCircuit, Code2, Layers, CheckCircle2, ExternalLink } from 'lucide-react';

export const HelpDocsPage: React.FC = () => {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Help & Technical Documentation</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Comprehensive guide to CustomerSeg workflows, machine learning methodologies, and system API endpoints.
        </p>
      </div>

      {/* Section 1: User Manual */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h3 className="font-bold text-base text-slate-900 flex items-center space-x-2">
          <BookOpen size={18} className="text-indigo-600" />
          <span>User Manual & Operational Guide</span>
        </h3>
        <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
          <p>
            <strong>1. Ingesting Data:</strong> Navigate to the <em>Datasets</em> module or use the <em>Segmentation Studio</em> to upload any CSV dataset. The platform automatically detects column headers, data types, missing records, and formats.
          </p>
          <p>
            <strong>2. Configuring Features:</strong> Select the relevant behavioral and demographic columns (such as Annual Income, Spending Score, Total Spend, Purchase Frequency). Exclude identifiers like Customer Name or Email Address to eliminate bias.
          </p>
          <p>
            <strong>3. Preprocessing:</strong> Choose your missing value imputation strategy (Mean, Median, or Drop) and feature scaling method (StandardScaler or MinMaxScaler) to ensure Euclidean distances are calculated on standardized scales.
          </p>
          <p>
            <strong>4. Running Clustering:</strong> Inspect the automated Elbow curve and Silhouette score to determine the optimal number of clusters (k), then click <em>Run Segmentation Now</em>.
          </p>
          <p>
            <strong>5. Campaign Personalization:</strong> Switch to the <em>Campaigns</em> module to craft targeted email, SMS, or push messages with dynamic placeholders (<code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-700">&#123;&#123;CustomerName&#125;&#125;</code>) sized precisely to your eligible customer segment count.
          </p>
        </div>
      </div>

      {/* Section 2: Machine Learning Methodology */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h3 className="font-bold text-base text-slate-900 flex items-center space-x-2">
          <BrainCircuit size={18} className="text-indigo-600" />
          <span>Machine Learning Methodology</span>
        </h3>
        <div className="text-xs text-slate-600 space-y-4 leading-relaxed">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <h4 className="font-bold text-slate-900 mb-1">1. K-Means Clustering Algorithm</h4>
            <p>
              K-Means partitions \(n\) observations into \(k\) clusters in which each observation belongs to the cluster with the nearest centroid mean. Distance is computed via the Euclidean metric:
            </p>
            <div className="p-2 bg-white rounded border border-slate-200 font-mono text-[11px] my-2 text-indigo-700">
              d(x, c_k) = &radic;(&Sigma; (x_i - c_k,i)&sup2;)
            </div>
            <p>
              Centroids are updated iteratively until convergence or until max iterations are reached with reproducible random initialization.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <h4 className="font-bold text-slate-900 mb-1">2. Silhouette Score Validation</h4>
            <p>
              Measures how similar an object is to its own cluster compared to other clusters. The silhouette coefficient for a sample \(i\) ranges between -1 and +1:
            </p>
            <div className="p-2 bg-white rounded border border-slate-200 font-mono text-[11px] my-2 text-indigo-700">
              s(i) = (b(i) - a(i)) / max(a(i), b(i))
            </div>
            <p>
              Where \(a(i)\) is the mean intra-cluster distance and \(b(i)\) is the mean nearest-cluster distance. Scores &gt; 0.5 indicate strong, distinguishable cluster boundaries.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <h4 className="font-bold text-slate-900 mb-1">3. Decision Tree White-Box Explainability</h4>
            <p>
              Unsupervised clustering often produces "black-box" numeric centroids. CustomerSeg fits an interpretable <code className="bg-white px-1 py-0.5 rounded text-indigo-700">DecisionTreeClassifier</code> over the learned cluster assignments to extract explicit rule boundaries (e.g. <em>If AnnualIncome &gt; $70k and SpendingScore &gt; 60 &rarr; Segment 2</em>).
            </p>
          </div>
        </div>
      </div>

      {/* Section 3: REST API Reference */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h3 className="font-bold text-base text-slate-900 flex items-center space-x-2">
          <Code2 size={18} className="text-indigo-600" />
          <span>REST API Endpoint Reference</span>
        </h3>
        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
              <tr>
                <th className="py-2.5 px-3">Method</th>
                <th className="py-2.5 px-3">Endpoint</th>
                <th className="py-2.5 px-3">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              <tr>
                <td className="py-2 px-3 text-indigo-600 font-bold">POST</td>
                <td className="py-2 px-3">/api/v1/auth/login</td>
                <td className="py-2 px-3 font-sans text-slate-600">Authenticate user credentials and receive JWT</td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-emerald-600 font-bold">GET</td>
                <td className="py-2 px-3">/api/v1/dashboard/summary</td>
                <td className="py-2 px-3 font-sans text-slate-600">Retrieve quantitative KPIs for active dataset</td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-emerald-600 font-bold">GET</td>
                <td className="py-2 px-3">/api/v1/dashboard/charts</td>
                <td className="py-2 px-3 font-sans text-slate-600">Retrieve Recharts visual analytics datasets</td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-indigo-600 font-bold">POST</td>
                <td className="py-2 px-3">/api/v1/datasets/upload</td>
                <td className="py-2 px-3 font-sans text-slate-600">Upload and ingest CSV dataset with header parsing</td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-indigo-600 font-bold">POST</td>
                <td className="py-2 px-3">/api/v1/segmentation/run</td>
                <td className="py-2 px-3 font-sans text-slate-600">Trigger Python K-Means clustering and persist run</td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-emerald-600 font-bold">GET</td>
                <td className="py-2 px-3">/api/v1/customers/export</td>
                <td className="py-2 px-3 font-sans text-slate-600">Export filtered customer directory as CSV</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HelpDocsPage;
