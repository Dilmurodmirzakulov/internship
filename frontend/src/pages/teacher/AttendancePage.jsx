import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import API_BASE_URL from '../../config/api';
import { useAuthStore } from '../../store/authStore';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const AttendancePage = () => {
  const { t } = useTranslation();
  const { token } = useAuthStore(state => ({ token: state.token }));

  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [date, setDate] = useState(new Date());
  const [students, setStudents] = useState([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      fetchAttendance();
    }
  }, [selectedGroup, date]);

  const fetchGroups = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/groups`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setGroups(data.groups || []);
        if (data.groups.length > 0) setSelectedGroup(data.groups[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAttendance = async () => {
    const dateStr = date.toISOString().split('T')[0];
    try {
      const res = await fetch(
        `${API_BASE_URL}/attendance/group/${selectedGroup}?date=${dateStr}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        const data = await res.json();
        setStudents(
          data.attendance.map(a => ({
            ...a.student,
            status: a.status,
          }))
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const updateStatus = (studentId, status) => {
    setStudents(prev =>
      prev.map(s => (s.id === studentId ? { ...s, status } : s))
    );
  };

  const saveAttendance = async () => {
    setSaving(true);
    setMessage('');
    const dateStr = date.toISOString().split('T')[0];
    const records = students.map(s => ({ student_id: s.id, status: s.status }));
    try {
      const res = await fetch(`${API_BASE_URL}/attendance`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ date: dateStr, records }),
      });
      if (res.ok) {
        setMessage(t('attendance.saved'));
      } else {
        const err = await res.json();
        setMessage(err.message || 'Error');
      }
    } catch (e) {
      setMessage('Network error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h4 className="fw-bold mb-3">{t('attendance.title')}</h4>

      <div className="row mb-3">
        <div className="col-md-4 mb-2">
          <label className="form-label">{t('attendance.group')}</label>
          <select
            className="form-select"
            value={selectedGroup}
            onChange={e => setSelectedGroup(e.target.value)}
          >
            {groups.map(g => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-4 mb-2">
          <label className="form-label">{t('attendance.date')}</label>
          <DatePicker
            selected={date}
            onChange={setDate}
            className="form-control"
            dateFormat="yyyy-MM-dd"
          />
        </div>
      </div>

      <div className="table-responsive">
        <table className="table">
          <thead>
            <tr>
              <th>{t('user.name')}</th>
              <th>{t('user.email')}</th>
              <th>{t('attendance.status')}</th>
            </tr>
          </thead>
          <tbody>
            {students.map(s => (
              <tr key={s.id}>
                <td>{s.name}</td>
                <td>{s.email}</td>
                <td>
                  <select
                    className="form-select"
                    value={s.status}
                    onChange={e => updateStatus(s.id, e.target.value)}
                  >
                    <option value="present">{t('attendance.present')}</option>
                    <option value="absent">{t('attendance.absent')}</option>
                    <option value="excused">{t('attendance.excused')}</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {message && <div className="alert alert-info mt-2">{message}</div>}

      <button
        className="btn btn-primary mt-3"
        onClick={saveAttendance}
        disabled={saving}
      >
        {saving ? t('attendance.saving') : t('attendance.save')}
      </button>
    </div>
  );
};

export default AttendancePage;
