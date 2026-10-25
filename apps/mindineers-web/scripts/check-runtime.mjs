if (Number(process.versions.node.split(".")[0]) !== 24)
  throw new Error(
    `Release verification requires Node 24; received ${process.version}.`,
  );
console.log(`Release runtime: ${process.version}`);
