import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import axios from '../services/axios';
import { selectUser, selectIsAuthenticated, updateProfile } from '../store/slices/authSlice';
import default_avatar from '../assets/icons/default_avatar.svg';
import '../styles/profile.css';

const ProfilePage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const currentUser = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  const [user, setUser] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ login: '', email: '', name: '' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const isOwnProfile = isAuthenticated && currentUser?.id === Number(id);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get(`/users/${id}`);
        setUser(res.data.user);
        setFormData({
          login: res.data.user.login,
          email: res.data.user.email,
          name: res.data.user.name || ''
        });
      } catch (err) {
        console.error('Failed to load profile:', err);
      }
    };
    fetchUser();
  }, [id]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
    if (file) {
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      await dispatch(updateProfile(formData)).unwrap();

      if (selectedFile) {
        const data = new FormData();
        data.append('avatar', selectedFile);
        await axios.post('/users/upload', data);
      }

      setMessage('Profile updated successfully!');
      setEditMode(false);
    } catch (err) {
      console.error(err);
      setMessage('Error updating profile.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div className="loading">Loading profile...</div>;

  return (
    <div className="profile-page">
      <div className="profile-card">
        <img
          src={
            preview
              ? preview
              : user.profile_picture && user.profile_picture !== 'uploads/default_profile.png'
              ? `../../API/${user.profile_picture}`
              : default_avatar
          }
          alt="avatar"
          className="profile-avatar"
        />

        {isOwnProfile && (
          <label className="upload-label">
            Change avatar
            <input type="file" accept="image/*" onChange={handleFileChange} hidden />
          </label>
        )}

        {!editMode ? (
          <>
            <h2>{user.login}</h2>
            <p className="profile-role">{user.role}</p>
            <p>{user.email}</p>
            <p>{user.name}</p>

            {isOwnProfile && (
              <button onClick={() => setEditMode(true)} className="btn-primary">
                Edit Profile
              </button>
            )}
          </>
        ) : (
          <form onSubmit={handleSave} className="edit-form">
            <label>Login</label>
            <input name="login" value={formData.login} onChange={handleChange} />

            <label>Email</label>
            <input name="email" value={formData.email} onChange={handleChange} />

            <label>Name</label>
            <input name="name" value={formData.name} onChange={handleChange} />

            <div className="form-buttons">
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Saving...' : 'Save changes'}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setEditMode(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {message && <p className="message">{message}</p>}
      </div>
    </div>
  );
};

export default ProfilePage;
