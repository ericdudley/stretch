/**
 * This file contains the logic for populating the options
 * form within the Stretch page. initStretchForm() should be called
 *  in order to bootstrap the form and set up event listeners.
 */
import { loadOptions, saveOptions } from './stretchConfig';

const MAX_SETS = 5;

export const initStretchForm = (
  container: HTMLDivElement,
  onClose: () => void,
) => {
  let options = loadOptions();
  let openTimeout;

  const open = () => {
    if (openTimeout) {
      return;
    }
    openTimeout = setTimeout(() => {
      updateDOM();
      openTimeout = null;
    }, 500);
  };

  const close = () => {
    clearTimeout(openTimeout);
    openTimeout = null;
    saveOptions(options);
    container.innerHTML = '';
  };

  const updateOptions = () => {
    options = loadOptions();
  };

  const updateDOM = () => {
    updateOptions();
    container.innerHTML = '';

    const title = document.createElement('h2');
    title.innerText = 'Options';
    container.appendChild(title);

    const { sets } = options.routines[0];
    for (let i = 0; i < sets.length; i += 1) {
      const form = document.createElement('div');
      form.classList.add('stretch-options-set-form');

      const setTitle = document.createElement('h3');
      setTitle.innerText = `Set ${i + 1}`;
      container.appendChild(setTitle);

      const repsLabel = document.createElement('label');
      repsLabel.innerText = 'Reps';
      form.appendChild(repsLabel);
      const reps = document.createElement('input');
      reps.type = 'number';
      reps.value = sets[i].reps.toString();
      reps.classList.add('stretch-options-input');
      reps.addEventListener('change', () => {
        sets[i].reps = parseInt(reps.value, 10);
        saveOptions(options);
      });
      form.appendChild(reps);

      const repsDurationLabel = document.createElement('label');
      repsDurationLabel.innerText = 'Rep Duration (s)';
      form.appendChild(repsDurationLabel);
      const repDuration = document.createElement('input');
      repDuration.type = 'number';
      repDuration.value = sets[i].repDuration.toString();
      repDuration.classList.add('stretch-options-input');
      repDuration.addEventListener('change', () => {
        options.routines[0].sets[i].repDuration = parseInt(
          repDuration.value,
          10,
        );
        saveOptions(options);
      });
      form.appendChild(repDuration);

      const switchSidesLabel = document.createElement('label');
      switchSidesLabel.innerText = 'Switch Sides';
      form.appendChild(switchSidesLabel);
      const switchSides = document.createElement('input');
      switchSides.type = 'checkbox';
      switchSides.checked = sets[i].switchSides;
      switchSides.addEventListener('change', () => {
        sets[i].switchSides = switchSides.checked;
        saveOptions(options);
      });
      form.appendChild(switchSides);

      const removeButton = document.createElement('button');
      removeButton.innerText = 'Remove Set';
      removeButton.classList.add('stretch-options-form-button');
      removeButton.addEventListener('click', () => {
        sets.splice(i, 1);
        saveOptions(options);
        updateDOM();
      });
      removeButton.disabled = options.routines[0].sets.length === 1;

      form.appendChild(removeButton);

      container.appendChild(form);
    }

    const buttonContainer = document.createElement('div');
    buttonContainer.classList.add('stretch-options-form-button-container');
    container.appendChild(buttonContainer);

    const closeButton = document.createElement('button');
    closeButton.innerText = 'Close';
    closeButton.classList.add('stretch-options-form-button');
    closeButton.addEventListener('click', () => {
      onClose();
    });
    buttonContainer.appendChild(closeButton);

    const newButton = document.createElement('button');
    newButton.innerText = 'Add set +';
    newButton.classList.add('stretch-options-form-button');
    newButton.addEventListener('click', () => {
      updateOptions();
      options.routines[0].sets.push({
        reps: 5,
        repDuration: 30,
        switchSides: true,
      });
      saveOptions(options);
      updateDOM();
    });

    if (options.routines[0].sets.length >= MAX_SETS) {
      newButton.disabled = true;
    }
    buttonContainer.appendChild(newButton);
  };

  return { openStretchForm: open, closeStretchForm: close };
};
