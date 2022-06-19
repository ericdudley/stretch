/**
 * This file contains the logic for saving and loading the configuration
 * object for the Stretch page using the browser's local storage API.
 *
 * All operations are synchronous and, the configuration object is
 * guaranteed to have a default value, if the user does not already have one.
 */
const LOCAL_STORAGE_KEY = 'stretch-options';
export interface StretchSet {
  reps: number;
  repDuration: number;
  switchSides: boolean;
}

export interface StretchRoutine {
  name: string;
  sets: StretchSet[];
}

export interface StretchOptions {
  routines: StretchRoutine[];
}

export const saveOptions = (options: StretchOptions) => {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(options));
};

export const loadOptions = (): StretchOptions => {
  const options = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (options) {
    return JSON.parse(options);
  }
  const defaultOptions: StretchOptions = {
    routines: [
      {
        name: 'Default',
        sets: [
          {
            reps: 5,
            repDuration: 30,
            switchSides: true,
          },
          {
            reps: 5,
            repDuration: 30,
            switchSides: true,
          },
          {
            reps: 5,
            repDuration: 30,
            switchSides: true,
          },
          {
            reps: 5,
            repDuration: 30,
            switchSides: false,
          },
        ],
      },
    ],
  };
  saveOptions(defaultOptions);
  return defaultOptions;
};
