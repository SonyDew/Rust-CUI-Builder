import React, { useState } from 'react';

const CreateTeamModal = ({ onConfirm, onCancel }) => {
  const [projectName, setProjectName] = useState('');
  const [teammateEmail, setTeammateEmail] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!projectName.trim()) {
      setError('Project name is required');
      return;
    }
    if (!teammateEmail.trim()) {
      setError('Teammate email is required');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(teammateEmail)) {
      setError('Please enter a valid email');
      return;
    }

    onConfirm(projectName, teammateEmail);
  };

  return (
    <div className="confirm-modal" style={{ width: '450px' }}>
      <h3>Create Team Project</h3>
      <p>Create a new project and invite a collaborator.</p>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: '#aaa' }}>Project Name</label>
        <input
          type="text"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          placeholder="e.g. Clan Base V2"
          style={{ width: '100%' }}
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: '#aaa' }}>Teammate Email</label>
        <input
          type="text"
          value={teammateEmail}
          onChange={(e) => setTeammateEmail(e.target.value)}
          placeholder="colleague@example.com"
          style={{ width: '100%' }}
        />
      </div>

      {error && <div style={{ color: '#ff4d4f', marginBottom: '15px', fontSize: '12px' }}>{error}</div>}

      <div className="confirm-actions">
        <button className="btn" onClick={onCancel}>Cancel</button>
        <button
          className="btn btn-primary"
          onClick={handleSubmit}
        >
          Create Team Project
        </button>
      </div>
    </div>
  );
};

export default CreateTeamModal;
