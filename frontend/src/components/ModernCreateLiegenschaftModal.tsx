import React, { useState } from 'react';
import { useMutation } from 'react-query';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { api } from '../services/api';
import { Dialog, DialogActions, DialogBody, DialogDescription, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Field, Label } from './ui/fieldset';

interface CreateLiegenschaftModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ModernCreateLiegenschaftModal: React.FC<CreateLiegenschaftModalProps> = ({ open, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    description: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = useMutation(
    async (data: typeof formData) => {
      const response = await api.post('/liegenschaften', data);
      return response.data;
    },
    {
      onSuccess: () => {
        onSuccess();
        onClose();
        // Reset form
        setFormData({ name: '', address: '', description: '' });
        setErrors({});
      },
      onError: (error: any) => {
        if (error.response?.data?.errors) {
          setErrors(error.response.data.errors);
        } else {
          setErrors({
            general: error.response?.data?.message || 'Fehler beim Erstellen der Liegenschaft'
          });
        }
      }
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Name ist erforderlich';
    }
    if (!formData.address.trim()) {
      newErrors.address = 'Adresse ist erforderlich';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    createMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Neue Liegenschaft erstellen</DialogTitle>
        <DialogDescription>
          Erstellen Sie eine neue Liegenschaft im System. Alle mit * markierten Felder sind Pflichtfelder.
        </DialogDescription>

        <DialogBody className="space-y-6">
          {errors.general && (
            <div className="rounded-lg bg-red-50 p-4 dark:bg-red-900/30">
              <p className="text-sm text-red-800 dark:text-red-200">{errors.general}</p>
            </div>
          )}

          <Field>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="z.B. Hauptgebäude München"
              invalid={!!errors.name}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
            )}
          </Field>

          <Field>
            <Label htmlFor="address">Adresse *</Label>
            <Input
              id="address"
              name="address"
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="z.B. Musterstraße 123, 80333 München"
              invalid={!!errors.address}
            />
            {errors.address && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.address}</p>
            )}
          </Field>

          <Field>
            <Label htmlFor="description">Beschreibung</Label>
            <Textarea
              id="description"
              name="description"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optionale Beschreibung der Liegenschaft"
            />
          </Field>
        </DialogBody>

        <DialogActions>
          <Button type="button" plain onClick={onClose}>
            Abbrechen
          </Button>
          <Button
            type="submit"
            color="indigo"
            disabled={createMutation.isLoading}
          >
            {createMutation.isLoading ? 'Erstellen...' : 'Erstellen'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ModernCreateLiegenschaftModal;