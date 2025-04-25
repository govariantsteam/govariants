// https://github.com/mdn/dom-examples/blob/main/web-speech-api/speak-easy-synthesis/script.js

export function stop_and_speak(text: string): void {
  window.speechSynthesis.cancel();

  const utter = new SpeechSynthesisUtterance(text);
  window.speechSynthesis.speak(utter);
}
