import { Block, CloudShape, Cylinder } from "./shared";

export function WorldIsland({ stage }: { stage: number }) {
  const colors = ["#ecd7ed", "#a9cede", "#b9ddce", "#d3dce9", "#c7b1dc"];
  return (
    <>
      <Block
        position={[0, -0.65, 0]}
        size={[12, 1, 12]}
        radius={0.5}
        color={colors[stage]}
      />
      <Block
        position={[0, -1.3, 0]}
        size={[10.8, 0.7, 10.8]}
        radius={0.5}
        color={["#bda0ce", "#6f98b6", "#72ac99", "#b5b0ce", "#927eaf"][stage]}
      />
      <Block
        position={[0, -0.13, 0]}
        size={[11.5, 0.1, 11.5]}
        radius={0.45}
        color={
          stage === 0
            ? "#efd9eb"
            : stage === 1
              ? "#c9e1eb"
              : stage === 2
                ? "#cce8d9"
                : stage === 3
                  ? "#e4e9f4"
                  : "#dfcdec"
        }
      />
      {stage === 2 && <>
        <Cylinder position={[0, -1.35, 0]} radius={7} height={.4} color="#72ac99" />
        {[-1, 1].map((side) => <Block key={side} position={[side * 5.1, -.015, 0]} size={[.12, .04, 9]} color="#78ac95" />)}
      </>}
      {stage === 1 &&
        [-1, 1].map((side) => (
          <Block
            key={side}
            position={[side * 4.6, -0.02, 0]}
            size={[0.05, 0.025, 8.2]}
            color="#81bed6"
            glow={0.1}
          />
        ))}
      {stage === 4 &&
        [-1, 1].flatMap((side) =>
          [-3, 0, 3].map((z) => (
            <Block
              key={`${side}-${z}`}
              position={[side * 5, -0.02, z]}
              size={[0.16, 0.05, 0.5]}
              color="#f5daa0"
              glow={0.3}
            />
          )),
        )}
      {stage === 3 && <CloudShape position={[0, -2.8, 0]} scale={3.3} />}
    </>
  );
}
