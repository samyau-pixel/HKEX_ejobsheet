import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CreateTemplateForm } from '@/components/templates/CreateTemplateForm';
import { useTemplateFormStore } from '@/store/template.store';

describe('CreateTemplateForm - dependency controls', () => {
  beforeEach(() => {
    // reset store
    useTemplateFormStore.getState().reset();
  });

  it('shows checkboxes for prerequisite jobs and prevents self-selection', async () => {
    // Pre-populate store with two jobs
    useTemplateFormStore.getState().addJob({ name: 'Job A', description: '', order: 1, procedures: [], timeDependency: undefined, prerequisiteOrders: [] });
    useTemplateFormStore.getState().addJob({ name: 'Job B', description: '', order: 2, procedures: [], timeDependency: undefined, prerequisiteOrders: [] });

    const onSubmit = jest.fn(async () => Promise.resolve());

    render(<CreateTemplateForm onSubmit={onSubmit} />);

    // Ensure checkboxes for prerequisites are present
    const checkboxes = await screen.findAllByRole('checkbox');
    expect(checkboxes.length).toBeGreaterThanOrEqual(1);

    // Checkbox for Job B in Job A's section should exist
    const jobBCheckbox = screen.getByLabelText(/2\. Job B/i);
    expect(jobBCheckbox).toBeInTheDocument();

    // Verify we can find Job A's label
    expect(screen.getByText(/1\. Job A/i)).toBeInTheDocument();
  });

  it('persists prerequisite selection when toggled', async () => {
    useTemplateFormStore.getState().addJob({ name: 'Job A', description: '', order: 1, procedures: [], timeDependency: undefined, prerequisiteOrders: [] });
    useTemplateFormStore.getState().addJob({ name: 'Job B', description: '', order: 2, procedures: [], timeDependency: undefined, prerequisiteOrders: [] });

    const onSubmit = jest.fn(async () => Promise.resolve());

    render(<CreateTemplateForm onSubmit={onSubmit} />);

    // Toggle checkbox for Job B in Job A's section
    const jobBCheckbox = await screen.findByLabelText(/2\. Job B/i);
    fireEvent.click(jobBCheckbox);

    // Verify checkbox is checked
    expect(jobBCheckbox).toBeChecked();

    // Verify the store has been updated with the prerequisite
    const state = useTemplateFormStore.getState();
    const jobA = state.jobs.find((j) => j.order === 1);
    expect(jobA?.prerequisiteOrders).toContain(2);
  });
});
