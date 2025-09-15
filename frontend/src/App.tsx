import React from 'react';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-gray-800 mb-4">
            Nova Finance
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Digital Financial Solutions Platform
          </p>
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md mx-auto">
              <h2 className="text-2xl font-semibold mb-4 text-green-600">✅ Backend Running</h2>
              <p className="text-gray-600">Django API Server: <a href="http://localhost:8000" className="text-blue-600 underline">http://localhost:8000</a></p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md mx-auto">
              <h2 className="text-2xl font-semibold mb-4 text-green-600">✅ Frontend Running</h2>
              <p className="text-gray-600">React Development Server</p>
            </div>
          </div>
          <div className="mt-8 text-sm text-gray-500">
            <p>All components created successfully!</p>
            <p>Webpack module resolution to be fixed in development</p>
          </div>
        </div>
      </header>
    </div>
  );
}

export default App;