import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from '../components/auth/Login';
import Signup from '../components/auth/Register';
import ChatWindow from '../components/chat/ChatWindow';
import Profile from '../components/profile/Profile';
import FriendProfile from '../components/profile/friendProfile';
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import Layout from '../components/layout/Layout';

const PrivateRoute = ({ children }) => {
  const { currentUser } = useAuth();
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  return children;
};

const AppRouter = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Signup />} />
          <Route path="/" element={
            <PrivateRoute>
              <Layout>
                <ChatWindow />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/profile" element={
            <PrivateRoute>
              <Layout>
                <Profile />
              </Layout>
            </PrivateRoute>
          } />

    <Route path="/profile/:uid" element={
    <PrivateRoute>
      <Layout>
       <FriendProfile />
       </Layout>
     </PrivateRoute>
} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default AppRouter;
