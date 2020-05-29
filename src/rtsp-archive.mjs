import { ServiceRecorder } from "./service-recorder.mjs";

export default async function setup(sp) {
  await sp.declareServices({
    recorder: {
      type: ServiceRecorder,
      autostart: true
    }
  });

  await sp.start();
}

