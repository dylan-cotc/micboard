import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, CheckCircle, AlertCircle, X, GripVertical, Minus } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { adminAPI } from '../../services/api';
import { useLocation } from '../../contexts/LocationContext';
import type { Microphone, Person } from '../../types';

interface SortableMicrophoneProps {
  mic: Microphone;
  draggedPersonId: number | null;
  onEdit: (mic: Microphone) => void;
  onDelete: (mic: Microphone) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, micId: number) => void;
  onUnassign: (micId: number, personId: number) => void;
}

function SortableMicrophone({ mic, draggedPersonId, onEdit, onDelete, onDragOver, onDrop, onUnassign }: SortableMicrophoneProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: mic.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Render separator differently
  if (mic.is_separator) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="flex items-center gap-3 py-4 my-2"
      >
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-2 hover:bg-gray-100 rounded"
        >
          <GripVertical className="w-5 h-5 text-gray-400" />
        </div>
        <div className="flex-1 flex items-center gap-3">
          <div className="flex-1 border-t-2 border-gray-300"></div>
          {mic.name && mic.name !== 'Separator' && (
            <>
              <span className="text-sm font-medium text-gray-500 px-2">{mic.name}</span>
              <div className="flex-1 border-t-2 border-gray-300"></div>
            </>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(mic)}
            className="p-2 text-gray-600 hover:text-primary hover:bg-gray-100 rounded transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(mic)}
            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        borderColor: draggedPersonId ? '#3B82F6' : 'transparent',
      }}
      className="bg-white rounded-lg shadow-md p-6 border-2 border-transparent transition-colors"
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, mic.id)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-2 hover:bg-gray-100 rounded"
          >
            <GripVertical className="w-5 h-5 text-gray-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{mic.name}</h3>
            {mic.description && (
              <p className="text-sm text-gray-600 mt-1">{mic.description}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(mic)}
            className="p-2 text-gray-600 hover:text-primary hover:bg-gray-100 rounded transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(mic)}
            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700">
          Assigned ({mic.assigned_people.length})
        </p>
        {mic.assigned_people.map((person) => (
          <div
            key={person.id}
            className="flex items-center justify-between px-3 py-2 bg-green-50 border border-green-200 rounded"
          >
            <span className="text-sm">
              {person.first_name} {person.last_name}
            </span>
            <button
              onClick={() => onUnassign(mic.id, person.id)}
              className="text-red-600 hover:text-red-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
        {mic.assigned_people.length === 0 && (
          <p className="text-sm text-gray-500">No one assigned</p>
        )}
      </div>
    </div>
  );
}

export default function Microphones() {
  const { selectedLocation } = useLocation();
  const [microphones, setMicrophones] = useState<Microphone[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [availablePeople, setAvailablePeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMic, setEditingMic] = useState<Microphone | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', isSeparator: false });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [draggedPersonId, setDraggedPersonId] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (selectedLocation) {
      fetchData();
    }
  }, [selectedLocation]);

  useEffect(() => {
    // Calculate available people (not assigned to any mic)
    const assignedIds = new Set(
      microphones.flatMap((mic) => mic.assigned_people.map((p) => p.id))
    );
    setAvailablePeople(people.filter((p) => !assignedIds.has(p.id)));
  }, [microphones, people]);

  const fetchData = async () => {
    if (!selectedLocation) return;

    setLoading(true);
    try {
      const [micsData, peopleData] = await Promise.all([
        adminAPI.getMicrophones(selectedLocation.id),
        adminAPI.getPeople(selectedLocation.id),
      ]);
      setMicrophones(micsData);
      setPeople(peopleData);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load data' });
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = microphones.findIndex((mic) => mic.id === active.id);
      const newIndex = microphones.findIndex((mic) => mic.id === over.id);

      const newMicrophones = arrayMove(microphones, oldIndex, newIndex);
      setMicrophones(newMicrophones);

      // Save new order to backend
      try {
        await adminAPI.reorderMicrophones(newMicrophones.map((mic) => mic.id));
      } catch (error) {
        setMessage({ type: 'error', text: 'Failed to save microphone order' });
        // Revert on error
        await fetchData();
      }
    }
  };

  const handleOpenModal = (mic?: Microphone, isSeparator: boolean = false) => {
    if (mic) {
      setEditingMic(mic);
      setFormData({ name: mic.name, description: mic.description || '', isSeparator: mic.is_separator });
    } else {
      setEditingMic(null);
      setFormData({ name: isSeparator ? 'Separator' : '', description: '', isSeparator });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingMic(null);
    setFormData({ name: '', description: '', isSeparator: false });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLocation) return;

    setMessage(null);

    try {
      if (editingMic) {
        await adminAPI.updateMicrophone(editingMic.id, formData.name, formData.description);
        setMessage({ type: 'success', text: formData.isSeparator ? 'Separator updated successfully!' : 'Microphone updated successfully!' });
      } else {
        await adminAPI.createMicrophone(formData.name, formData.description, selectedLocation.id, formData.isSeparator);
        setMessage({ type: 'success', text: formData.isSeparator ? 'Separator created successfully!' : 'Microphone created successfully!' });
      }
      await fetchData();
      handleCloseModal();
    } catch (error) {
      setMessage({ type: 'error', text: formData.isSeparator ? 'Failed to save separator' : 'Failed to save microphone' });
    }
  };

  const handleDelete = async (mic: Microphone) => {
    if (!confirm(`Are you sure you want to delete ${mic.name}?`)) {
      return;
    }

    try {
      await adminAPI.deleteMicrophone(mic.id);
      setMessage({ type: 'success', text: 'Microphone deleted successfully!' });
      await fetchData();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete microphone' });
    }
  };

  const handleAssign = async (micId: number, personId: number) => {
    try {
      await adminAPI.assignMicrophone(micId, personId);
      await fetchData();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to assign microphone' });
    }
  };

  const handleUnassign = async (micId: number, personId: number) => {
    try {
      await adminAPI.unassignMicrophone(micId, personId);
      await fetchData();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to unassign microphone' });
    }
  };

  const handleDragStart = (personId: number) => {
    setDraggedPersonId(personId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, micId: number) => {
    e.preventDefault();
    if (draggedPersonId) {
      await handleAssign(micId, draggedPersonId);
      setDraggedPersonId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Microphones</h1>
          <p className="text-gray-600 mt-2">Manage microphones and assignments</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => handleOpenModal(undefined, true)}
            className="flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            <Minus className="w-5 h-5" />
            Add Separator
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Microphone
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`flex items-center gap-2 p-4 rounded-lg mb-6 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Available People */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Available People ({availablePeople.length})
          </h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {availablePeople.map((person) => (
              <div
                key={person.id}
                draggable
                onDragStart={() => handleDragStart(person.id)}
                className="px-3 py-2 bg-blue-50 border border-blue-200 rounded cursor-move hover:bg-blue-100 transition-colors"
              >
                {person.first_name} {person.last_name}
                {person.position_name && (
                  <div className="text-xs text-gray-600 mt-1">{person.position_name}</div>
                )}
              </div>
            ))}
            {availablePeople.length === 0 && (
              <p className="text-gray-500 text-sm">All people are assigned</p>
            )}
          </div>
        </div>

        {/* Microphones */}
        <div className="lg:col-span-2">
          {microphones.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <p className="text-gray-600 mb-4">No microphones created yet.</p>
              <button
                onClick={() => handleOpenModal()}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Create First Microphone
              </button>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={microphones} strategy={verticalListSortingStrategy}>
                <div className="space-y-4">
                  {microphones.map((mic) => (
                    <SortableMicrophone
                      key={mic.id}
                      mic={mic}
                      draggedPersonId={draggedPersonId}
                      onEdit={handleOpenModal}
                      onDelete={handleDelete}
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      onUnassign={handleUnassign}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {editingMic
                ? (formData.isSeparator ? 'Edit Separator' : 'Edit Microphone')
                : (formData.isSeparator ? 'Create Separator' : 'Create Microphone')
              }
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {formData.isSeparator ? 'Label (optional)' : 'Name *'}
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder={formData.isSeparator ? 'e.g., Vocals, Band' : 'e.g., Mic 1'}
                  required={!formData.isSeparator}
                />
                {formData.isSeparator && (
                  <p className="text-xs text-gray-500 mt-1">
                    Leave as "Separator" for a plain line, or add a label like "Vocals"
                  </p>
                )}
              </div>
              {!formData.isSeparator && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Optional description"
                    rows={3}
                  />
                </div>
              )}
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors"
                >
                  {editingMic ? 'Save Changes' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
