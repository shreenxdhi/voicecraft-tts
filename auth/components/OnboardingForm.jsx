import { useState } from 'react';
import { useAuth } from '../utils/AuthContext';

const OnboardingForm = () => {
  const { user, completeOnboarding } = useAuth();
  const [formData, setFormData] = useState({
    displayName: user?.displayName || '',
    preferredVoice: '',
    usageType: '',
    termsAccepted: false
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    // Validate form
    if (!formData.displayName.trim()) {
      setError('Please enter a display name');
      setLoading(false);
      return;
    }
    
    if (!formData.preferredVoice) {
      setError('Please select a preferred voice');
      setLoading(false);
      return;
    }
    
    if (!formData.usageType) {
      setError('Please select your usage type');
      setLoading(false);
      return;
    }
    
    if (!formData.termsAccepted) {
      setError('You must accept the terms and conditions');
      setLoading(false);
      return;
    }
    
    try {
      const success = await completeOnboarding(formData);
      if (!success) {
        throw new Error('Failed to complete onboarding');
      }
      // Completion is handled by AuthContext
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card max-w-2xl">
      <div className="auth-header">
        <h2 className="text-2xl font-bold">Welcome to VoiceCraft</h2>
        <p className="text-dark-400 dark:text-light-600 mt-2">Let's set up your account</p>
      </div>
      
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-xl mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="displayName" className="form-label">Display name</label>
          <input
            id="displayName"
            name="displayName"
            type="text"
            className="form-input"
            value={formData.displayName}
            onChange={handleChange}
            required
          />
        </div>
        
        <div>
          <label className="form-label">Preferred voice</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
            <label className="flex items-center space-x-3 p-3 border border-light-500 dark:border-dark-500 rounded-xl cursor-pointer hover:bg-light-300 dark:hover:bg-dark-500 transition-colors">
              <input
                type="radio"
                name="preferredVoice"
                value="en-us"
                checked={formData.preferredVoice === 'en-us'}
                onChange={handleChange}
                className="w-4 h-4 text-primary-600"
              />
              <span>Sarah (US)</span>
            </label>
            
            <label className="flex items-center space-x-3 p-3 border border-light-500 dark:border-dark-500 rounded-xl cursor-pointer hover:bg-light-300 dark:hover:bg-dark-500 transition-colors">
              <input
                type="radio"
                name="preferredVoice"
                value="en-gb"
                checked={formData.preferredVoice === 'en-gb'}
                onChange={handleChange}
                className="w-4 h-4 text-primary-600"
              />
              <span>Emma (UK)</span>
            </label>
            
            <label className="flex items-center space-x-3 p-3 border border-light-500 dark:border-dark-500 rounded-xl cursor-pointer hover:bg-light-300 dark:hover:bg-dark-500 transition-colors">
              <input
                type="radio"
                name="preferredVoice"
                value="en-au"
                checked={formData.preferredVoice === 'en-au'}
                onChange={handleChange}
                className="w-4 h-4 text-primary-600"
              />
              <span>Nicole (AU)</span>
            </label>
            
            <label className="flex items-center space-x-3 p-3 border border-light-500 dark:border-dark-500 rounded-xl cursor-pointer hover:bg-light-300 dark:hover:bg-dark-500 transition-colors">
              <input
                type="radio"
                name="preferredVoice"
                value="en-in"
                checked={formData.preferredVoice === 'en-in'}
                onChange={handleChange}
                className="w-4 h-4 text-primary-600"
              />
              <span>Priya (IN)</span>
            </label>
          </div>
        </div>
        
        <div>
          <label className="form-label">How will you use VoiceCraft?</label>
          <select
            name="usageType"
            className="form-input"
            value={formData.usageType}
            onChange={handleChange}
            required
          >
            <option value="" disabled>Select an option</option>
            <option value="personal">Personal use</option>
            <option value="content">Content creation</option>
            <option value="business">Business</option>
            <option value="education">Education</option>
            <option value="other">Other</option>
          </select>
        </div>
        
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              id="termsAccepted"
              name="termsAccepted"
              type="checkbox"
              checked={formData.termsAccepted}
              onChange={handleChange}
              className="w-4 h-4 text-primary-600 rounded border-light-500 dark:border-dark-500"
              required
            />
          </div>
          <label htmlFor="termsAccepted" className="ml-3 text-sm text-dark-600 dark:text-light-400">
            I agree to the <a href="#" className="text-primary-600 hover:underline">Terms of Service</a> and <a href="#" className="text-primary-600 hover:underline">Privacy Policy</a>
          </label>
        </div>
        
        <div>
          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={loading}
          >
            {loading ? 'Setting up your account...' : 'Get started'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default OnboardingForm; 