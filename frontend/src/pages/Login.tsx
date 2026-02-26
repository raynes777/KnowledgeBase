import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../lib/api';
import { useAuthStore } from '../store/authStore';

const DEMO_CREDENTIALS = [
  { email: 'sponsor@pharma.com', password: 'Sponsor2024', name: 'Dr. Maria Rossi', role: 'SPONSOR', org: 'Novartis Italia' },
  { email: 'researcher@hospital.it', password: 'Research2024', name: 'Prof. Giovanni Bianchi', role: 'RESEARCHER', org: 'Policlinico San Raffaele' },
  { email: 'hospital@gemelli.it', password: 'Hospital2024', name: 'Dr. Laura Verdi', role: 'HOSPITAL', org: 'Policlinico Gemelli' },
];

export default function Login() {
  const navigate = useNavigate();
  const setToken = useAuthStore((state) => state.setToken);
  const [formData, setFormData] = useState({
    email: 'sponsor@pharma.com',
    password: 'Sponsor2024',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const selectCredentials = (cred: typeof DEMO_CREDENTIALS[0]) => {
    setFormData({ email: cred.email, password: cred.password });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authApi.login(formData);
      setToken(response.data.accessToken);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Clinical Trial Documentation
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to your account
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          <div className="text-center">
            <Link to="/register" className="text-sm text-indigo-600 hover:text-indigo-500">
              Don't have an account? Register here
            </Link>
          </div>
        </form>

        <div className="mt-6 border-t pt-6">
          <p className="text-center text-sm text-gray-500 mb-3">Quick Login (Demo)</p>
          <div className="space-y-2">
            {DEMO_CREDENTIALS.map((cred) => (
              <button
                key={cred.email}
                type="button"
                onClick={() => selectCredentials(cred)}
                className={`w-full flex items-center justify-between px-4 py-2 border rounded-md text-sm transition-colors ${
                  formData.email === cred.email
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 text-xs rounded font-medium ${
                    cred.role === 'SPONSOR' ? 'bg-purple-100 text-purple-700' :
                    cred.role === 'RESEARCHER' ? 'bg-blue-100 text-blue-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {cred.role}
                  </span>
                  <span className="font-medium">{cred.name}</span>
                </div>
                <span className="text-xs text-gray-500">{cred.org}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
