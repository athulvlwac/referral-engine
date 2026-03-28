# Frontend Implementation Guide: Authentication & User Panels

The backend has been completely refactored to support **Role-Based Access Control (RBAC)**. The APIs are now secured with JWT Bearer tokens and separated into `admin` and `user` routes. 

Here are the exact changes needed in the React frontend.

## 1. Authentication Endpoints

You must create a centralized Auth Context to store the user's JWT token, User Role, and User ID.

### `POST /auth/login`
- **Request Body:** Requires `username` (which is the email address) and `password` submitted as `x-www-form-urlencoded` or JSON. Because we are using FastAPI's standard OAuth2 schema, send it as `FormData`.
- **Response:**
  ```json
  {
    "access_token": "eyJhbG... (long JWT token string)",
    "token_type": "bearer",
    "role": "admin" // or "user"
  }
  ```
- **React Action:** Store the `access_token` and `role` in `localStorage`. 

### `POST /auth/register`
- **Request Body:** JSON payload containing `name`, `email`, `password`, and `referral_code`.
- **Logic:** 
  - Every single regular User Registration *must* include a `referral_code`. 
  - Submitting it will simultaneously build their account, hash their password, and create the required `<User> -> <Parent>` graph edge all in one transaction.

---

## 2. API Authorization Headers

For all future calls to the API (Admin or User), you must append the `Authorization` header with the Bearer Token.

```javascript
// Example Axios Interceptor
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

---

## 3. Route Separation (Admin vs User)

You need to implement an `AuthGuard` wrapper around your React Router paths that checks the `role` saved in `localStorage`.

### Admin Dashboard (Restricted)
**Condition:** `role === 'admin'`
Only admins have the permission to access these endpoints. All metrics, fraud logs, and network-wide `/users` endpoints are locked down with a `require_admin` dependency. 
If a normal User hits these endpoints, they will get a `403 Forbidden` error.

**Admin APIs:**
- `GET /dashboard/metrics`
- `GET /users`
- `GET /referrals`
- `GET /fraud/flags`
- `POST /rewards/process-batch`

### User Panel (New!)
**Condition:** `role === 'user'`
When a regular user logs in, route them to a new, simpler React View `UserDashboard.jsx`.

**Available User APIs:**
- `GET /user/me`
  - Returns the Profile information, their personal `reward_balance`, their uniquely generated `referral_code` (so they can copy/paste it and send it to friends), and the count of their direct downline.
- `GET /user/me/graph`
  - Works exactly like the Admin's referral chart, but it restricts the root node to *only* the logged-in User's ID so they can only see people they are responsible for.

---

## 4. Building the "Signup via Link" Flow

When a user invites someone using their referral link (e.g., `http://yourdomain.com/register?ref=A1B2C3D4`), the new user should be directed to the registration page, with the code already filled into an input box.

### A. Pre-filling the Registration Form
Extract the code from the URL and set it as the initial state of the `referral_code` input field. The user should be able to see the code they are using.

```javascript
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';

function RegisterPage() {
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get('ref') || '';
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    referral_code: refCode
  });
  
  const [referrerName, setReferrerName] = useState(null);

  // Optional: Verify the code is valid to show "Invited by [Name]"
  useEffect(() => {
    if (formData.referral_code.length >= 5) {
      axios.get(`http://127.0.0.1:8000/auth/verify-referral/${formData.referral_code}`)
        .then(res => setReferrerName(res.data.referrer_name))
        .catch(() => setReferrerName(null));
    } else {
      setReferrerName(null);
    }
  }, [formData.referral_code]);

  return (
    <form>
      {/* Basic Inputs... */}
      <input 
        type="text" 
        value={formData.referral_code} 
        onChange={(e) => setFormData({...formData, referral_code: e.target.value})}
        placeholder="Referral Code (Required)" 
      />
      
      {referrerName && <p className="text-success">Invited by: {referrerName}</p>}
      
      <button type="submit">Complete Registration</button>
    </form>
  );
}
```

Every user is automatically generated a unique 8-character, alphanumeric `referral_code` when their account is created. When a user logs in, they can hit a "Copy My Link" button that generates the link: `http://your_domain.com/register?ref=${profile.user.referral_code}`.
