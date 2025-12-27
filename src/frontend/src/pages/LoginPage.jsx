import React from 'react';
import LoginForm from '../features/auth/components/LoginForm.jsx';
import '../App.css';
function LoginPage() {
  return (
    <div> 
      {/* <AuthLayout> */}
        <LoginForm />
      {/* </AuthLayout> */}
    </div>
  );
}

export default LoginPage;