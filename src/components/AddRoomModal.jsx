import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import {
  X, Home, DoorOpen, BedDouble, UtensilsCrossed, ChefHat,
  Sofa, Monitor, Car, Bath, Trees, Dumbbell, Baby, Music
} from 'lucide-react'
import './Modal.css'
import './AddRoomModal.css'

const ICONS = [
  { id: 'home', Icon: Home, label: 'Home' },
  { id: 'door-open', Icon: DoorOpen, label: 'Door' },
  { id: 'bed-double', Icon: BedDouble, label: 'Bedroom' },
  { id: 'utensils', Icon: UtensilsCrossed, label: 'Dining' },
  { id: 'chef-hat', Icon: ChefHat, label: 'Kitchen' },
  { id: 'sofa', Icon: Sofa, label: 'Living' },
  { id: 'monitor', Icon: Monitor, label: 'Office' },
  { id: 'car', Icon: Car, label: 'Garage' },
  { id: 'bath', Icon: Bath, label: 'Bath' },
  { id: 'trees', Icon: Trees, label: 'Garden' },
  { id: 'dumbbell', Icon: Dumbbell, label: 'Gym' },
  { id: 'baby', Icon: Baby, label: 'Kids' },
  { id: 'music', Icon: Music, label: 'Music' },
]

export default function AddRoomModal({ onClose }) {
  const { dispatch } = useApp()
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('home')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) return
    dispatch({ type: 'ADD_ROOM', name: name.trim(), icon })
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel add-room-panel" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Add Room</h2>
            <p>Create a new room to organize your devices</p>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="add-room-form">
          <div className="form-field">
            <label>Room Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Guest Bedroom"
              autoFocus
              required
            />
          </div>

          <div className="form-field">
            <label>Icon</label>
            <div className="icon-grid">
              {ICONS.map(({ id, Icon, label }) => (
                <button
                  key={id}
                  type="button"
                  className={`icon-option ${icon === id ? 'selected' : ''}`}
                  onClick={() => setIcon(id)}
                  title={label}
                >
                  <Icon size={20} strokeWidth={1.5} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="modal-done-btn" disabled={!name.trim()}>
              Add Room
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
