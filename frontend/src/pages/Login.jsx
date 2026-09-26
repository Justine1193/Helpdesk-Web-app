import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Mail,
  Lock,
  User,
  Building,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Headphones
} from 'lucide-react'
import { authService } from '../services/api.js'
import './Login.css'

export default function Login({ onLoginSuccess }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [isRegister, setIsRegister] = useState(false)

  // Form fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [department, setDepartment] = useState('Product Design')
  const [selectedRole, setSelectedRole] = useState('USER')
  const [rememberMe, setRememberMe] = useState(true)

  // UI state
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [showForgotModal, setShowForgotModal] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSubmitted, setForgotSubmitted] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both your email address and password.')
      return
    }

    if (isRegister && !fullName.trim()) {
      setErrorMessage('Please enter your full name.')
      return
    }

    setIsLoading(true)

    try {
      let authResult
      if (isRegister) {
        authResult = await authService.register({
          name: fullName.trim(),
          email: email.trim(),
          password: password.trim(),
          role: selectedRole,
          department: department
        })
        setSuccessMessage('Account created successfully. Logging in...')
      } else {
        authResult = await authService.login(email.trim(), password.trim())
        setSuccessMessage('Signed in successfully.')
      }

      const user = authResult?.user || {
        role: selectedRole,
        name: fullName.trim() || email.split('@')[0],
        email: email.trim(),
        department: department,
        initials: (fullName.trim() || email.split('@')[0])
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)
      }

      if (onLoginSuccess) {
        onLoginSuccess(user)
      }

      const destination = location.state?.from || '/'
      setTimeout(() => {
        navigate(destination, { replace: true })
      }, 300)
    } catch (err) {
      setErrorMessage(err.message || 'Invalid email or password. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPasswordSubmit = (e) => {
    e.preventDefault()
    if (!forgotEmail.trim()) return
    setForgotSubmitted(true)
    setTimeout(() => {
      setShowForgotModal(false)
      setForgotSubmitted(false)
      setForgotEmail('')
      setSuccessMessage('Password reset link sent to your email.')
      setTimeout(() => setSuccessMessage(''), 4000)
    }, 1000)
  }

  return (
    <div className="login-wrapper">
      <div className="login-box">
        {/* Brand Header */}
        <div className="login-brand">
          <div className="brand-icon">
            <Headphones size={22} color="#FFFFFF" />
          </div>
          <h1>HelpDesk Pro</h1>
          <p>Internal IT Support Platform</p>
        </div>

        {/* Tab Switcher */}
        <div className="auth-tabs">
          <button
            type="button"
            className={`tab-item ${!isRegister ? 'active' : ''}`}
            onClick={() => {
              setIsRegister(false)
              setErrorMessage('')
              setSuccessMessage('')
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`tab-item ${isRegister ? 'active' : ''}`}
            onClick={() => {
              setIsRegister(true)
              setErrorMessage('')
              setSuccessMessage('')
            }}
          >
            Create Account
          </button>
        </div>

        {/* Status Alerts */}
        {errorMessage && (
          <div className="auth-alert error">
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="auth-alert success">
            <CheckCircle2 size={16} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="login-form">
          {isRegister && (
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <div className="input-box">
                <User size={16} className="field-icon" />
                <input
                  id="name"
                  type="text"
                  placeholder="e.g. John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required={isRegister}
                  autoFocus
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-box">
              <Mail size={16} className="field-icon" />
              <input
                id="email"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus={!isRegister}
              />
            </div>
          </div>

          {isRegister && (
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="dept">Department</label>
                <div className="input-box">
                  <Building size={16} className="field-icon" />
                  <select
                    id="dept"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                  >
                    <option value="Product Design">Product Design</option>
                    <option value="IT Operations">IT Operations</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Finance & Ops">Finance & Ops</option>
                    <option value="Human Resources">Human Resources</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="role">Role</label>
                <div className="input-box">
                  <select
                    id="role"
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                  >
                    <option value="USER">Employee</option>
                    <option value="TECHNICIAN">Technician</option>
                    <option value="ADMIN">Administrator</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          <div className="form-group">
            <div className="label-row">
              <label htmlFor="password">Password</label>
              {!isRegister && (
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => setShowForgotModal(true)}
                >
                  Forgot password?
                </button>
              )}
            </div>
            <div className="input-box">
              <Lock size={16} className="field-icon" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="toggle-eye"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {!isRegister && (
            <div className="checkbox-row">
              <label className="checkbox-item">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember me on this computer</span>
              </label>
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={isLoading}>
            {isLoading ? 'Signing in...' : isRegister ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="login-footer">
          <span>IT Helpdesk & Ticket Management System</span>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="modal-overlay" onMouseDown={() => setShowForgotModal(false)}>
          <div className="modal-card" onMouseDown={(e) => e.stopPropagation()}>
            <h3>Reset Password</h3>
            <p>Enter your email to receive password reset instructions.</p>

            {forgotSubmitted ? (
              <div className="auth-alert success" style={{ marginTop: '14px' }}>
                <CheckCircle2 size={16} />
                <span>Sending reset link...</span>
              </div>
            ) : (
              <form onSubmit={handleForgotPasswordSubmit} style={{ marginTop: '16px' }}>
                <div className="form-group">
                  <label htmlFor="f-email">Work Email</label>
                  <div className="input-box">
                    <Mail size={16} className="field-icon" />
                    <input
                      id="f-email"
                      type="email"
                      placeholder="name@company.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                </div>
                <div className="modal-buttons">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowForgotModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Send Link
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
