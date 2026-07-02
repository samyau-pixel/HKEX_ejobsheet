import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { CreateTemplateForm } from '@/components/templates/CreateTemplateForm';
import { useTemplateFormStore } from '@/store/template.store';

describe('CreateTemplateForm - dependency controls', () => {
  beforeEach(() => {
    // reset store
    useTemplateFormStore.getState().reset();
  });

  it('allows selecting other jobs as prerequisites and prevents self-selection', async () => {
    // Pre-populate store with two jobs
    useTemplateFormStore.getState().addJob({ name: 'Job A', description: '', order: 1, procedures: [], timeDependency: undefined, prerequisiteOrders: [] });
    useTemplateFormStore.getState().addJob({ name: 'Job B', description: '', order: 2, procedures: [], timeDependency: undefined, prerequisiteOrders: [] });

    const onSubmit = jest.fn(async () => Promise.resolve());

    render(<CreateTemplateForm onSubmit={onSubmit} />);

    // Ensure selects are present
    const selects = await screen.findAllByRole('listbox');
    expect(selects.length).toBeGreaterThanOrEqual(2);

    // For job 1, options should include job 2 but not job 1
    const job1Select = selects[0];
    const optionTexts = Array.from(job1Select.querySelectorAll('option')).map((o) => o.textContent);
    expect(optionTexts).toContain('2. Job B');
    expect(optionTexts).not.toContain('1. Job A');
  });
});
