import {
  TRAIN_POINTS,
  VALIDATION_POINTS,
  TREE_DOMAIN,
  buildTree,
  accuracy as treeAccuracy,
  treeRegions,
  type TreeRegion,
} from "./overfitting-tree";
import { FOREST_TREES, ensembleAccuracy as forestAccuracy, forestRegions } from "./bagging";
import { trainBoosting, ensembleAccuracy as boostAccuracy, boostRegions } from "./boosting";

export { TRAIN_POINTS, VALIDATION_POINTS, TREE_DOMAIN };

const DEPTH1_TREE = buildTree(TRAIN_POINTS, 1);
const DEPTH6_TREE = buildTree(TRAIN_POINTS, 6);
const BOOST_ROUNDS_ON_TRAIN = trainBoosting(TRAIN_POINTS, 5);
const BOOST_ROUNDS_USED = 5;

export interface ScoreboardEntry {
  key: string;
  label: string;
  trainAccuracy: number;
  validationAccuracy: number;
  regions: TreeRegion[];
}

/** All four models trained on the exact same dataset from Chapters 8-10, scored on the same held-out set. */
export const SCOREBOARD: ScoreboardEntry[] = [
  {
    key: "depth1",
    label: "Single tree (depth 1)",
    trainAccuracy: treeAccuracy(DEPTH1_TREE, TRAIN_POINTS),
    validationAccuracy: treeAccuracy(DEPTH1_TREE, VALIDATION_POINTS),
    regions: treeRegions(DEPTH1_TREE, TREE_DOMAIN[0], TREE_DOMAIN[1]),
  },
  {
    key: "depth6",
    label: "Single tree (depth 6, overfit)",
    trainAccuracy: treeAccuracy(DEPTH6_TREE, TRAIN_POINTS),
    validationAccuracy: treeAccuracy(DEPTH6_TREE, VALIDATION_POINTS),
    regions: treeRegions(DEPTH6_TREE, TREE_DOMAIN[0], TREE_DOMAIN[1]),
  },
  {
    key: "bagging",
    label: "Bagged forest (20 depth-6 trees)",
    trainAccuracy: forestAccuracy(FOREST_TREES, TRAIN_POINTS),
    validationAccuracy: forestAccuracy(FOREST_TREES, VALIDATION_POINTS),
    regions: forestRegions(FOREST_TREES, TREE_DOMAIN[0], TREE_DOMAIN[1]),
  },
  {
    key: "boosting",
    label: "AdaBoost (5 rounds of stumps)",
    trainAccuracy: boostAccuracy(BOOST_ROUNDS_ON_TRAIN, BOOST_ROUNDS_USED, TRAIN_POINTS),
    validationAccuracy: boostAccuracy(BOOST_ROUNDS_ON_TRAIN, BOOST_ROUNDS_USED, VALIDATION_POINTS),
    regions: boostRegions(BOOST_ROUNDS_ON_TRAIN, BOOST_ROUNDS_USED, TREE_DOMAIN[0], TREE_DOMAIN[1]),
  },
];

export const BEST_VALIDATION_ACCURACY = Math.max(...SCOREBOARD.map((e) => e.validationAccuracy));
