/** Spacious, ascending routes. Heights describe the actual walkable object tops. */
export type StackKind =
  | "gateway" | "service" | "queue" | "auth" | "cache" | "apiPipe" | "response"
  | "dbStack" | "dbRow" | "dbIndex" | "dbShard" | "dbJoin" | "dbReplica" | "dbCommit"
  | "container" | "cloudBucket" | "loadBalancer" | "cloudLift" | "satellite" | "region"
  | "artifact" | "buildRoller" | "testPad" | "releaseGate" | "deployPad";
export type StackStep = [StackKind, number, number, number, number, number, ("static" | "slide" | "elevator")?];
export const stackLayouts: Record<number, StackStep[]> = {
  1: [
    ["gateway", 0, .4, -10, 6, 5],
    ["service", 2, 1.3, -16, 4.7, 4.6],
    ["queue", 4, 2.2, -22, 5.2, 4.5, "slide"],
    ["queue", 3, 3.2, -28, 4.2, 4.5],
    ["auth", 1, 4.1, -34, 5.5, 5],
    ["apiPipe", -1, 5, -40, 4.4, 5],
    ["cache", -3, 5.8, -46, 5.4, 5],
    ["service", -4, 6.7, -52, 5, 5, "elevator"],
    ["service", -2, 10.6, -58, 5, 4.5],
    ["queue", 0, 11.5, -64, 5.2, 4.6],
    ["apiPipe", 2, 10.8, -70, 5, 5],
    ["cache", 4, 11.8, -76, 5, 5],
    ["auth", 3, 12.8, -82, 5.5, 5],
    ["service", 1, 14, -88, 5, 5],
    ["response", 0, 15.2, -94, 5.5, 5],
  ],
  2: [
    ["dbRow", 0, .4, -10, 6, 5],
    ["dbStack", -2, 1.4, -16, 4.8, 4.8],
    ["dbRow", -4, 2.4, -22, 5.2, 4.8],
    ["dbShard", -3, 3.3, -28, 4.8, 4.8],
    ["dbJoin", -1, 4.2, -34, 6, 5],
    ["dbStack", 1, 5.2, -40, 4.8, 4.8],
    ["dbIndex", 3, 6.2, -46, 5.4, 5, "elevator"],
    ["dbRow", 4, 10.1, -52, 5, 5],
    ["dbReplica", 2, 11.1, -58, 5.4, 5],
    ["dbShard", 0, 10.4, -64, 4.8, 4.8],
    ["dbJoin", -2, 11.4, -70, 6, 5],
    ["dbReplica", -4, 12.4, -76, 5.4, 5],
    ["dbRow", -3, 13.4, -82, 5.2, 5],
    ["dbStack", -1, 14.3, -88, 5, 5],
    ["dbCommit", 0, 15.3, -94, 5.4, 5.4],
  ],
  3: [
    ["container", 0, .4, -10, 6, 5],
    ["cloudBucket", 2, 1.4, -16, 4.8, 4.8],
    ["satellite", 4, 2.4, -22, 6.2, 5],
    ["container", 3, 3.4, -28, 5.6, 5, "slide"],
    ["loadBalancer", 1, 4.4, -34, 6, 5],
    ["cloudBucket", -1, 5.3, -40, 4.8, 4.8],
    ["cloudLift", -3, 6.2, -46, 5.5, 5, "elevator"],
    ["region", -4, 10.1, -52, 6, 5.2],
    ["container", -2, 11.1, -58, 5.6, 5],
    ["satellite", 0, 10.4, -64, 6.2, 5],
    ["loadBalancer", 2, 11.4, -70, 6, 5],
    ["cloudBucket", 4, 12.4, -76, 5, 5],
    ["container", 3, 13.4, -82, 5.6, 5],
    ["region", 1, 14.3, -88, 6, 5.2],
    ["releaseGate", 0, 15.3, -94, 5.8, 5],
  ],
  4: [
    ["artifact", 0, .5, -10, 5, 5],
    ["buildRoller", -2, 1.5, -16, 5.5, 5],
    ["testPad", -3, 2.5, -22, 5, 5],
    ["testPad", -1, 3.5, -28, 4.6, 4.6],
    ["artifact", 1, 4.5, -34, 5, 5],
    ["buildRoller", 3, 5.5, -40, 5.5, 5, "slide"],
    ["releaseGate", 2, 6.5, -46, 5.8, 5],
    ["testPad", 0, 7.5, -52, 5, 5],
    ["artifact", -2, 8.5, -58, 5, 5],
    ["releaseGate", -1, 9.5, -64, 5.8, 5],
    ["deployPad", 0, 10, -72, 12, 12],
  ],
};
export const launchSite = { x: 0, height: 10, offsetZ: -74 };
export const stackKinds = new Set<string>(Object.values(stackLayouts).flat().map((p) => p[0]));
/** Reached objects stay powered during a visit, including after a fall. */
export const stackJourney = { activated: new Set<string>() };
