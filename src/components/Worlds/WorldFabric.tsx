import { UIPlaygroundScenery } from "./UIPlayground";
import { FrontendBackdrop } from "./FrontendBackdrop";
import { FrontendScenes } from "./FrontendScenes";
import { StackScenes } from "./StackScenes";
export default function WorldFabric({ stage }: { stage: number }) {
  return stage === 0 ? <><FrontendScenes /><FrontendBackdrop /><UIPlaygroundScenery /></> : <StackScenes stage={stage} />;
}
