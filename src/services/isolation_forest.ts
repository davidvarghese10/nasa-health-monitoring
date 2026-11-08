/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Isolation Forest (iForest) Implementation
 * Unsupervised machine learning algorithm for anomaly detection in physiological telemetry.
 * Based on Liu, Ting, & Zhou (2008).
 */

export interface IsolationTreeNode {
  splitFeature?: number;
  splitValue?: number;
  left?: IsolationTreeNode;
  right?: IsolationTreeNode;
  size: number;
}

function cFactor(n: number): number {
  if (n <= 1) return 0;
  if (n === 2) return 1;
  const eulerMascheroni = 0.5772156649;
  return 2 * (Math.log(n - 1) + eulerMascheroni) - (2 * (n - 1) / n);
}

export class IsolationTree {
  root: IsolationTreeNode;
  maxHeight: number;

  constructor(data: number[][], maxHeight: number) {
    this.maxHeight = maxHeight;
    this.root = this.buildTree(data, 0);
  }

  private buildTree(data: number[][], currentHeight: number): IsolationTreeNode {
    const n = data.length;
    if (n <= 1 || currentHeight >= this.maxHeight) {
      return { size: n };
    }

    const numFeatures = data[0].length;
    const eligibleFeatures: number[] = [];

    // Find features that have variation
    for (let f = 0; f < numFeatures; f++) {
      let min = data[0][f];
      let max = data[0][f];
      for (let i = 1; i < n; i++) {
        if (data[i][f] < min) min = data[i][f];
        if (data[i][f] > max) max = data[i][f];
      }
      if (max > min) {
        eligibleFeatures.push(f);
      }
    }

    if (eligibleFeatures.length === 0) {
      return { size: n };
    }

    // Pick random feature
    const splitFeature = eligibleFeatures[Math.floor(Math.random() * eligibleFeatures.length)];
    let minVal = data[0][splitFeature];
    let maxVal = data[0][splitFeature];
    for (let i = 1; i < n; i++) {
      if (data[i][splitFeature] < minVal) minVal = data[i][splitFeature];
      if (data[i][splitFeature] > maxVal) maxVal = data[i][splitFeature];
    }

    // Uniform random split value between min and max
    const splitValue = minVal + Math.random() * (maxVal - minVal);

    const leftData: number[][] = [];
    const rightData: number[][] = [];

    for (let i = 0; i < n; i++) {
      if (data[i][splitFeature] < splitValue) {
        leftData.push(data[i]);
      } else {
        rightData.push(data[i]);
      }
    }

    return {
      splitFeature,
      splitValue,
      size: n,
      left: this.buildTree(leftData, currentHeight + 1),
      right: this.buildTree(rightData, currentHeight + 1),
    };
  }

  pathLength(point: number[], node: IsolationTreeNode, currentPath: number): number {
    if (!node.left || !node.right || node.splitFeature === undefined || node.splitValue === undefined) {
      return currentPath + cFactor(node.size);
    }

    if (point[node.splitFeature] < node.splitValue) {
      return this.pathLength(point, node.left, currentPath + 1);
    } else {
      return this.pathLength(point, node.right, currentPath + 1);
    }
  }
}

export class IsolationForest {
  private trees: IsolationTree[] = [];
  private numTrees: number;
  private subSampleSize: number;
  private cN: number = 1;

  constructor(numTrees: number = 100, subSampleSize: number = 256) {
    this.numTrees = numTrees;
    this.subSampleSize = subSampleSize;
  }

  fit(data: number[][]): void {
    if (data.length === 0) return;
    const n = data.length;
    const sampleSize = Math.min(n, this.subSampleSize);
    const maxHeight = Math.ceil(Math.log2(Math.max(sampleSize, 2)));
    this.cN = cFactor(sampleSize);
    this.trees = [];

    for (let t = 0; t < this.numTrees; t++) {
      // Subsample without replacement
      const sampleIndices = new Set<number>();
      while (sampleIndices.size < sampleSize) {
        sampleIndices.add(Math.floor(Math.random() * n));
      }
      const sample = Array.from(sampleIndices).map(idx => data[idx]);
      this.trees.push(new IsolationTree(sample, maxHeight));
    }
  }

  /**
   * Returns anomaly score between 0.0 and 1.0.
   * Score > 0.60 indicates strong outlier anomaly;
   * Score < 0.50 indicates nominal sample.
   */
  score(point: number[]): number {
    if (this.trees.length === 0 || this.cN <= 0) return 0.5;

    let totalPath = 0;
    for (const tree of this.trees) {
      totalPath += tree.pathLength(point, tree.root, 0);
    }
    const avgPath = totalPath / this.trees.length;
    const exponent = -(avgPath / this.cN);
    return Math.pow(2, exponent);
  }

  predict(points: number[][], threshold: number = 0.62): { scores: number[]; isAnomaly: boolean[] } {
    const scores = points.map(p => this.score(p));
    const isAnomaly = scores.map(s => s >= threshold);
    return { scores, isAnomaly };
  }
}
