import React from 'react';
import AppRoutes from './routes/AppRoutes';
import './App.css'; // Giữ lại CSS global nếu bạn cần

function App() {
  return (
    <div className="App">
      <AppRoutes />
    </div>
  );
}

export default App;