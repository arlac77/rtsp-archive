import { ServiceRecorder } from "./service-recorder.mjs";


export async function setup(sp) {

  await sp.configureServices({
    recorder: {
      type: ServiceRecorder
    }
  });

  sp.start();
}

