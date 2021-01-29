import { ServiceRecorder } from "./service-recorder.mjs";

export default async function initialize(sp) {
  await sp.declareServices({
    recorder: {
      type: ServiceRecorder,
      autostart: true
    }
  });
}

