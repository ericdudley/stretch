/**
 * This file contains the logic for the Stretch page.
 * initStretch should be called to bootstrap the interactivity of the page.
 */

import { Howl } from 'howler';
import stretchSoundsPath from '../audio/stretch_sounds.mp3';
import { loadOptions, StretchRoutine } from './stretchConfig';
import { initStretchForm } from './stretchForm';

const beginTimeS = 13;
const betweenSetTimeS = 15;
const breakTimeS = 7;
const repTimeS = 30;
const maxSet = 3;
const maxRep = 5;
const stepDurationMs = 1000;
type Sound =
  | 'session_started'
  | 'begin'
  | 'stop_switch_sides'
  | 'stop_rep_number'
  | 'completed'
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '10'
  | 'stop_set_number'
  | 'starting_set_number'
  | 'in'
  | 'seconds'
  | 'session_paused'
  | 'session_resumed'
  | 'session_ended'
  | 'dont_give_up'
  | 'youre_doing_a_great_job';

type Side = 'L' | 'R';

// Sets up the state and event listeners for the Stretch page
const initStretch = () => {
  // DOM element references
  let title: HTMLButtonElement;
  let button: HTMLButtonElement;
  let stopButton: HTMLButtonElement;
  let optionsButton: HTMLButtonElement;
  let innerElement: HTMLDivElement;
  let outerElement: HTMLDivElement;
  let stretchContentElement: HTMLDivElement;
  let repDashesContainerElement: HTMLDivElement;
  let repDashElements: HTMLDivElement[];
  let setDashesContainerElement: HTMLDivElement;
  let setDashElements: HTMLDivElement[];

  /**
   * Update all of the DOM element references in case the elements were
   * replaced since the last time.
   */
  const updateElementRefs = () => {
    title = document.querySelector('#stretch-title');

    button = document.querySelector('#stretch-button');
    stopButton = document.querySelector('#stretch-stop-button');
    optionsButton = document.querySelector('#stretch-options-button');
    innerElement = document.querySelector('#stretch-inner-circle');
    outerElement = document.querySelector('#stretch-outer-circle');
    stretchContentElement = document.querySelector('.stretch');
    repDashesContainerElement = document.querySelector(
      '#stretch-rep-dashes-container',
    );
    repDashElements = Array.from(
      document.querySelectorAll<HTMLDivElement>('.stretch__rep__dashes__dash'),
    );
    setDashesContainerElement = document.querySelector(
      '#stretch-set-dashes-container',
    );
    setDashElements = Array.from(
      document.querySelectorAll<HTMLDivElement>('.stretch__set__dashes__dash'),
    );
  };
  updateElementRefs();

  /**
   * Adjust the style of an element and its children to place the children
   * tangentially around the element with a given radius of circleSize / 2.
   */
  const setElementChildrenOnCircle = (
    element: HTMLDivElement,
    itemCount: number,
    circleSize: string,
    offsetDeg: number,
  ) => {
    element.style.width = circleSize;
    element.style.height = circleSize;
    element.style.padding = '0';
    element.style.borderRadius = '50%';
    element.style.listStyle = 'none';

    const angle = 180 / itemCount;
    let rot = offsetDeg + (angle * 0.5 + 90);
    for (let i = 0; i < element.children.length; i += 1) {
      const child = element.children[i] as HTMLDivElement;
      child.style.display = 'block';
      child.style.position = 'absolute';
      child.style.top = '50%';
      child.style.left = '50%';
      child.style.transformOrigin = 'center';
      child.style.transform = `translateX(-50%)
      translateY(-50%)
      rotate(${rot}deg)
      translate(${circleSize})`;
      rot += angle;
    }
  };

  /**
   * Check if the current routine's set count and current set's rep count match what is in the
   * DOM, if not, replace all of the elements with the correct number of elements.
   */
  const updateDashElements = () => {
    const newMaxSets = routine.sets.length;
    const newMaxReps = routine.sets[currentSet - 1]?.reps || 0;

    if (newMaxSets !== setDashesContainerElement.children.length) {
      setDashesContainerElement.innerHTML = '';
      for (let i = 0; i < newMaxSets; i += 1) {
        const dash = document.createElement('div');
        dash.classList.add('stretch__set__dashes__dash');
        dash.classList.add('stretch__dashes__dash');
        setDashesContainerElement.appendChild(dash);
      }
      setElementChildrenOnCircle(
        setDashesContainerElement,
        newMaxSets,
        '18vmin',
        0,
      );
    }
    if (newMaxReps !== repDashesContainerElement.children.length) {
      repDashesContainerElement.innerHTML = '';
      for (let i = 0; i < newMaxReps; i += 1) {
        const dash = document.createElement('div');
        dash.classList.add('stretch__rep__dashes__dash');
        dash.classList.add('stretch__dashes__dash');
        repDashesContainerElement.appendChild(dash);
      }
      setElementChildrenOnCircle(
        repDashesContainerElement,
        newMaxReps,
        '18vmin',
        180,
      );
    }
    updateDOM();
  };

  const soundTimes: Record<Sound, [number, number]> = {
    1: [23847, 406],
    2: [25066, 464],
    3: [26215, 430],
    4: [27365, 499],
    5: [28514, 499],
    6: [29536, 650],
    7: [30604, 592],
    8: [31777, 348],
    9: [32891, 557],
    10: [33913, 476],
    session_started: [337, 2000],
    begin: [5968, 476],
    stop_switch_sides: [7605, 1462],
    stop_rep_number: [10310, 1567],
    completed: [13340, 662],
    stop_set_number: [15035, 1550],
    starting_set_number: [18170, 1521],
    in: [20619, 453],
    seconds: [22338, 545],
    session_paused: [35840, 1161],
    session_resumed: [38208, 1103],
    session_ended: [40623, 1150],
    dont_give_up: [43247, 975],
    youre_doing_a_great_job: [44536, 1254],
  };
  const positiveSounds: Sound[] = ['dont_give_up', 'youre_doing_a_great_job'];
  const soundPromises = {};

  const howl = new Howl({
    src: [stretchSoundsPath],
    sprite: soundTimes,
    onend: (soundId) => {
      if (soundPromises[soundId]) {
        soundPromises[soundId].res();
        soundPromises[soundId] = undefined;
      }
    },
  });

  const promisePlay = (sound: Sound): Promise<void> => new Promise((res, rej) => {
    howl.stop();
    const soundId = howl.play(sound);
    soundPromises[soundId] = { res, rej };
  });

  const say = (sounds: Sound[], isNestedCall = false) => {
    if (sounds.length === 0) {
      return;
    }
    if (!isNestedCall && Math.random() < 0.05) {
      sounds.push(
        positiveSounds[Math.floor(Math.random() * positiveSounds.length)],
      );
    }
    const currentSound = sounds[0];
    promisePlay(currentSound).then(() => {
      say(sounds.slice(1), true);
    });
  };

  // Application state
  let isActive = false;
  let isPaused = false;
  let isBreak = false;
  let isOptions = false;
  let currentRep = 0;
  let currentSide: Side = 'R';
  let currentSet = 0;
  let currentTime = 0;
  let currentStartTime = 0;
  let lastStepTimestamp = 0;
  let startTimeout;
  let routine: StretchRoutine;

  // Helpers to get the current routine/set's configuration
  const getMaxReps = () => routine.sets[currentSet - 1].reps ?? 0;
  const getMaxSets = () => routine.sets.length ?? 0;
  const getRepDuration = () => routine.sets[currentSet - 1]?.repDuration ?? 0;
  const getSwitchSides = () => routine.sets[currentSet - 1]?.switchSides ?? 0;

  /**
   * Update the DOM with the latest application state,
   * should be called whenever the application state changes.
   */
  const updateDOM = () => {
    updateElementRefs();

    for (let i = 0; i < repDashElements.length; i += 1) {
      if (!isActive) {
        repDashElements[i].dataset.status = '';
        repDashElements[i].innerHTML = '';
      } else if (i + 1 < currentRep) {
        repDashElements[i].dataset.status = 'done';
        repDashElements[i].innerHTML = '';
      } else if (i + 1 === currentRep) {
        repDashElements[i].dataset.status = 'active';
        repDashElements[i].innerHTML = getSwitchSides()
          ? `<span>${currentSide}</span>`
          : '';
      } else {
        repDashElements[i].dataset.status = undefined;
        repDashElements[i].innerHTML = '';
      }
    }

    for (let i = 0; i < setDashElements.length; i += 1) {
      if (!isActive) {
        setDashElements[i].dataset.status = '';
      } else if (i + 1 < currentSet) {
        setDashElements[i].dataset.status = 'done';
      } else if (i + 1 === currentSet) {
        setDashElements[i].dataset.status = 'active';
      } else {
        setDashElements[i].dataset.status = undefined;
      }
    }
    const progress = isActive
      ? 50
        + 50
          * ((isBreak ? currentTime : currentStartTime - currentTime)
            / currentStartTime)
      : 100;

    innerElement.style.width = `${progress}%`;
    innerElement.style.height = `${progress}%`;
  };

  // Start a session, hiding/showing elements, and setting isActive to true.
  const start = () => {
    if (startTimeout) {
      return;
    }
    title.classList.add('hidden');
    outerElement.dataset.status = 'active';
    button.classList.add('pause');
    optionsButton.classList.add('hidden');
    say(['session_started']);
    [routine] = loadOptions().routines;
    currentRep = 1;
    currentSet = 1;
    updateDashElements();
    startTimeout = setTimeout(() => {
      repDashElements.forEach((elem) => elem.classList.remove('hidden'));
      setDashElements.forEach((elem) => elem.classList.remove('hidden'));
      isActive = true;
      isPaused = false;
      currentTime = beginTimeS;
      currentStartTime = beginTimeS;
      currentSide = 'R';
      isBreak = true;
      updateDOM();
    }, 1000);
  };

  /**
   * Pause a session, do not reset any state,
   * just stop step() from continuing the session.
   */
  const pause = () => {
    button.classList.remove('pause');
    stopButton.classList.add('active');

    say(['session_paused']);
    isPaused = true;
  };

  // Resume a session, do not reset any state, just allow step() to continue the session.
  const resume = () => {
    button.classList.add('pause');
    stopButton.classList.remove('active');
    say(['session_resumed']);
    isPaused = false;
  };

  // End a session, reset all state, and hide/show elements.
  const end = () => {
    clearTimeout(startTimeout);
    startTimeout = undefined;
    button.classList.remove('pause');
    title.classList.remove('hidden');
    optionsButton.classList.remove('hidden');
    stopButton.classList.remove('active');

    outerElement.dataset.status = '';
    repDashesContainerElement.innerHTML = '';
    setDashesContainerElement.innerHTML = '';
    isActive = false;
    isBreak = false;
    currentTime = repTimeS;
    currentStartTime = repTimeS;
    currentRep = maxRep;
    currentSet = maxSet;
    currentSide = 'R';
    updateDOM();
    say(['session_ended']);
  };

  /**
   * Function that contains the session's application logic for updating
   * the current set, rep, and time. Should be called every second.
   */
  const step = () => {
    if (!isActive || isPaused) {
      return;
    }

    currentTime -= 1;

    if (isBreak) {
      if (currentTime === 0) {
        isBreak = false;
        currentTime = getRepDuration();
        currentStartTime = getRepDuration();
        say(['begin']);
      }
    } else if (currentTime === 0) {
      if (getSwitchSides() && currentSide === 'R') {
        currentSide = 'L';
        currentTime = breakTimeS;
        currentStartTime = breakTimeS;
        isBreak = true;
        say(['stop_switch_sides']);
      } else {
        currentRep += 1;
        currentSide = 'R';

        if (currentRep === getMaxReps() + 1) {
          currentRep = 1;
          currentSet += 1;
          currentTime = betweenSetTimeS;
          currentStartTime = betweenSetTimeS;
          isBreak = true;
          say([
            'stop_set_number',
            String(currentSet - 1) as Sound,
            'completed',
            'starting_set_number',
            String(currentSet) as Sound,
            'in',
            '10',
            'seconds',
          ]);
          updateDashElements();
        } else {
          currentTime = breakTimeS;
          currentStartTime = breakTimeS;
          isBreak = true;
          say([
            'stop_rep_number',
            String(currentRep - 1) as Sound,
            'completed',
          ]);
        }

        if (currentSet === getMaxSets() + 1) {
          end();
        }
      }
    }

    updateDOM();
  };

  /**
   * Set up the interval that calls step() every second. Accounts for imperfect timing.
   * This interval is started on page dage, but is a noop if the session is not active or paused.
   */
  setInterval(() => {
    if (!lastStepTimestamp) {
      lastStepTimestamp = Date.now();
      step();
    } else {
      const stepCount = Math.round(
        (Date.now() - lastStepTimestamp) / stepDurationMs,
      );
      for (let _ = 0; _ < stepCount; _ += 1) {
        step();
      }
      lastStepTimestamp = Date.now();
    }
  }, 1000);

  // Event listener for the center "play/pause" button.
  const onButtonClick = (e: MouseEvent) => {
    if (isActive) {
      if (isPaused) {
        resume();
      } else {
        pause();
      }
    } else {
      start();
    }
    e.preventDefault();
  };

  // Event listener for the smaller "stop" square button.
  const onStopButtonClick = (e: MouseEvent) => {
    end();
    e.preventDefault();
  };

  // Closes the options modal and returns the UI to the original state.
  const closeOptions = () => {
    isOptions = false;
    title.classList.remove('hidden');
    innerElement.classList.remove('expanded');
    stretchContentElement.classList.remove('hidden');
    closeStretchForm();
  };

  // Set up the options form, and pass in a callback for an internal "close".
  const { openStretchForm, closeStretchForm } = initStretchForm(
    innerElement,
    closeOptions,
  );

  // Event listener for the cog button in the upper right.
  const onOptionsButtonClick = (e: MouseEvent) => {
    if (isOptions) {
      closeOptions();
    } else {
      isOptions = true;
      title.classList.add('hidden');
      innerElement.classList.add('expanded');
      stretchContentElement.classList.add('hidden');
      openStretchForm();
    }

    e.preventDefault();
  };

  // Set up event listeners for all buttons, make sure they will work across desktop and mobile.
  button.addEventListener('click', onButtonClick);
  button.addEventListener('touchstart', onButtonClick);
  stopButton.addEventListener('click', onStopButtonClick);
  stopButton.addEventListener('touchstart', onStopButtonClick);
  optionsButton.addEventListener('click', onOptionsButtonClick);
  optionsButton.addEventListener('touchstart', onOptionsButtonClick);
};

export default initStretch;
