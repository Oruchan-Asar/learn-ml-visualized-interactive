export type ChapterStatus = "shipped" | "planned";

export interface ChapterMeta {
  slug: string;
  part: string;
  chapterNumber: number;
  title: string;
  blurb: string;
  status: ChapterStatus;
  capstone?: boolean;
}

/**
 * The full curriculum — every part, every planned chapter, not just the
 * shipped ones. Single source of truth for the home page, the sidebar
 * overview, chapter headers, and prev/next nav. Planned chapters have no
 * route yet; getChapterNeighbors and the "chapter N of M" count only ever
 * consider shipped ones, so nav never points at a page that doesn't exist.
 */
export const CURRICULUM: ChapterMeta[] = [
  // ---------- Part I — Foundations ----------
  {
    slug: "what-is-a-gradient",
    part: "Part I — Foundations",
    chapterNumber: 1,
    title: "What is a gradient?",
    blurb:
      "Drag a point along a curve, watch the tangent line, and find the exact spot where the gradient hits zero.",
    status: "shipped",
  },
  {
    slug: "gradient-descent",
    part: "Part I — Foundations",
    chapterNumber: 2,
    title: "Gradient descent",
    blurb:
      "Take steps against the gradient, tune the learning rate, and see exactly how it can overshoot or diverge.",
    status: "shipped",
  },
  {
    slug: "the-chain-rule",
    part: "Part I — Foundations",
    chapterNumber: 3,
    title: "The chain rule",
    blurb:
      "Drag a point through two linked curves and watch two slopes multiply into the slope of the whole chain.",
    status: "shipped",
  },
  {
    slug: "vectors-and-dot-products",
    part: "Part I — Foundations",
    chapterNumber: 4,
    title: "Vectors & the dot product",
    blurb:
      "Drag an arrow around a fixed one and watch a single number reveal agreement, opposition, or a right angle.",
    status: "shipped",
  },
  {
    slug: "matrices-as-transformations",
    part: "Part I — Foundations",
    chapterNumber: 5,
    title: "Matrices as transformations",
    blurb: "Watch a matrix stretch, rotate, and flip a vector in real time.",
    status: "shipped",
  },
  {
    slug: "gradient-in-multiple-dimensions",
    part: "Part I — Foundations",
    chapterNumber: 6,
    title: "The gradient in multiple dimensions",
    blurb: "Extend \"downhill\" to two parameters at once, on a loss surface instead of a curve.",
    status: "shipped",
  },
  {
    slug: "probability-outcomes-and-distributions",
    part: "Part I — Foundations",
    chapterNumber: 7,
    title: "Probability: outcomes & distributions",
    blurb: "Build a distribution by dragging probability mass around, and watch it always sum to one.",
    status: "shipped",
  },
  {
    slug: "conditional-probability-and-bayes-rule",
    part: "Part I — Foundations",
    chapterNumber: 8,
    title: "Conditional probability & Bayes' rule",
    blurb: "Update a belief live as new evidence arrives, and see why the base rate keeps surprising people.",
    status: "shipped",
  },
  {
    slug: "information-and-entropy",
    part: "Part I — Foundations",
    chapterNumber: 9,
    title: "Information & entropy",
    blurb: "Measure surprise in bits, and notice it's the same math a decision tree uses to pick a split.",
    status: "shipped",
  },
  {
    slug: "capstone-two-parameter-descent",
    part: "Part I — Foundations",
    chapterNumber: 10,
    title: "Descend a two-parameter loss by hand",
    blurb: "Combine the gradient vector and gradient descent into one hands-on optimization from scratch.",
    status: "shipped",
    capstone: true,
  },

  // ---------- Part II — Classical ML ----------
  {
    slug: "linear-regression-fitting-a-line",
    part: "Part II — Classical ML",
    chapterNumber: 1,
    title: "Linear regression: fitting a line",
    blurb: "Drag a line's slope and intercept and watch the loss surface respond underneath it.",
    status: "shipped",
  },
  {
    slug: "loss-functions-mse-vs-mae",
    part: "Part II — Classical ML",
    chapterNumber: 2,
    title: "Loss functions: MSE vs. MAE",
    blurb: "See one outlier hijack a fit, and how the choice of loss function decides how much it matters.",
    status: "shipped",
  },
  {
    slug: "logistic-regression-and-the-sigmoid",
    part: "Part II — Classical ML",
    chapterNumber: 3,
    title: "Logistic regression & the sigmoid",
    blurb: "Squash a line into a probability and watch a decision boundary form between two classes.",
    status: "shipped",
  },
  {
    slug: "cross-entropy-loss",
    part: "Part II — Classical ML",
    chapterNumber: 4,
    title: "Cross-entropy loss",
    blurb: "Why classification needs a different loss than regression, and what it penalizes harder.",
    status: "shipped",
  },
  {
    slug: "gradient-descent-variants",
    part: "Part II — Classical ML",
    chapterNumber: 5,
    title: "Gradient descent variants",
    blurb: "Batch, stochastic, and mini-batch — the same hill, three different ways down it.",
    status: "shipped",
  },
  {
    slug: "momentum",
    part: "Part II — Classical ML",
    chapterNumber: 6,
    title: "Momentum",
    blurb: "Give descent a memory and watch it roll straight through small bumps that used to stall it.",
    status: "shipped",
  },
  {
    slug: "decision-trees-information-gain",
    part: "Part II — Classical ML",
    chapterNumber: 7,
    title: "Decision trees: splitting on information gain",
    blurb: "Grow a tree one split at a time, each one scored by the entropy chapter's own formula.",
    status: "shipped",
  },
  {
    slug: "overfitting-a-tree",
    part: "Part II — Classical ML",
    chapterNumber: 8,
    title: "Overfitting a tree",
    blurb: "Watch a tree memorize noise, then prune it back until it generalizes again.",
    status: "shipped",
  },
  {
    slug: "ensembles-bagging-and-random-forests",
    part: "Part II — Classical ML",
    chapterNumber: 9,
    title: "Ensembles I: bagging & random forests",
    blurb: "Average many overfit trees into one model that suddenly generalizes well.",
    status: "shipped",
  },
  {
    slug: "ensembles-boosting",
    part: "Part II — Classical ML",
    chapterNumber: 10,
    title: "Ensembles II: boosting",
    blurb: "Chain weak learners so each one fixes the mistakes the last one made.",
    status: "shipped",
  },
  {
    slug: "support-vector-machines",
    part: "Part II — Classical ML",
    chapterNumber: 11,
    title: "Support vector machines",
    blurb: "Drag the widest possible street between two classes, anchored by the points closest to it.",
    status: "shipped",
  },
  {
    slug: "the-kernel-trick",
    part: "Part II — Classical ML",
    chapterNumber: 12,
    title: "The kernel trick",
    blurb: "Lift unseparable data into another dimension where a straight line suddenly works.",
    status: "shipped",
  },
  {
    slug: "k-means-clustering",
    part: "Part II — Classical ML",
    chapterNumber: 13,
    title: "k-means clustering",
    blurb: "Watch cluster centers wander step by step until they settle on the data.",
    status: "shipped",
  },
  {
    slug: "pca-directions-of-maximum-variance",
    part: "Part II — Classical ML",
    chapterNumber: 14,
    title: "PCA: directions of maximum variance",
    blurb: "Find the axis a cloud of points is most stretched along, and project onto it.",
    status: "shipped",
  },
  {
    slug: "bias-variance-tradeoff",
    part: "Part II — Classical ML",
    chapterNumber: 15,
    title: "Bias–variance tradeoff",
    blurb: "Tune model complexity and watch two different error sources trade off against each other.",
    status: "planned",
  },
  {
    slug: "regularization-l1-vs-l2",
    part: "Part II — Classical ML",
    chapterNumber: 16,
    title: "Regularization: L1 vs. L2",
    blurb: "Penalize large weights and watch a model simplify itself two different ways.",
    status: "planned",
  },
  {
    slug: "capstone-classifier-pipeline",
    part: "Part II — Classical ML",
    chapterNumber: 17,
    title: "Build and compare a full classifier pipeline",
    blurb: "Same dataset, several models from this part, one scoreboard.",
    status: "planned",
    capstone: true,
  },

  // ---------- Part III — Neural Networks & Deep Learning ----------
  {
    slug: "the-perceptron",
    part: "Part III — Neural Networks & Deep Learning",
    chapterNumber: 1,
    title: "The perceptron",
    blurb: "A single artificial neuron, drawing its very first line.",
    status: "planned",
  },
  {
    slug: "activation-functions",
    part: "Part III — Neural Networks & Deep Learning",
    chapterNumber: 2,
    title: "Activation functions",
    blurb: "Compare step, sigmoid, tanh, and ReLU side by side on the same input.",
    status: "planned",
  },
  {
    slug: "the-forward-pass",
    part: "Part III — Neural Networks & Deep Learning",
    chapterNumber: 3,
    title: "The forward pass",
    blurb: "Stack neurons into a layer and watch numbers flow through it live.",
    status: "planned",
  },
  {
    slug: "a-network-is-a-chain",
    part: "Part III — Neural Networks & Deep Learning",
    chapterNumber: 4,
    title: "A network is a chain",
    blurb: "See why backprop is just Part I's chain rule, applied once per layer.",
    status: "planned",
  },
  {
    slug: "backpropagation-step-by-step",
    part: "Part III — Neural Networks & Deep Learning",
    chapterNumber: 5,
    title: "Backpropagation, step by step",
    blurb: "Walk a full two-layer gradient computation by hand, then check it against autograd.",
    status: "planned",
  },
  {
    slug: "loss-landscapes-in-high-dimensions",
    part: "Part III — Neural Networks & Deep Learning",
    chapterNumber: 6,
    title: "Loss landscapes in high dimensions",
    blurb: "Why \"stuck in a local minimum\" is rarer in practice than it sounds in theory.",
    status: "planned",
  },
  {
    slug: "optimizers-momentum-rmsprop-adam",
    part: "Part III — Neural Networks & Deep Learning",
    chapterNumber: 7,
    title: "Optimizers: momentum, RMSProp, Adam",
    blurb: "Race three optimizers down the same landscape and watch their paths diverge.",
    status: "planned",
  },
  {
    slug: "weight-initialization",
    part: "Part III — Neural Networks & Deep Learning",
    chapterNumber: 8,
    title: "Weight initialization",
    blurb: "Watch a network start dead on arrival, then come alive with better init.",
    status: "planned",
  },
  {
    slug: "vanishing-and-exploding-gradients",
    part: "Part III — Neural Networks & Deep Learning",
    chapterNumber: 9,
    title: "Vanishing & exploding gradients",
    blurb: "Watch a gradient shrink toward zero or blow up as it travels backward through depth.",
    status: "planned",
  },
  {
    slug: "batch-normalization",
    part: "Part III — Neural Networks & Deep Learning",
    chapterNumber: 10,
    title: "Batch normalization",
    blurb: "Re-center activations mid-network and watch a wobbly training run stabilize.",
    status: "planned",
  },
  {
    slug: "dropout",
    part: "Part III — Neural Networks & Deep Learning",
    chapterNumber: 11,
    title: "Dropout",
    blurb: "Randomly silence neurons during training and watch a network stop memorizing.",
    status: "planned",
  },
  {
    slug: "capstone-train-a-tiny-network",
    part: "Part III — Neural Networks & Deep Learning",
    chapterNumber: 12,
    title: "Train a tiny network live, in-browser",
    blurb: "Watch a decision boundary evolve epoch by epoch on real (small) data.",
    status: "planned",
    capstone: true,
  },

  // ---------- Part IV — Architectures ----------
  {
    slug: "convolution",
    part: "Part IV — Architectures",
    chapterNumber: 1,
    title: "Convolution",
    blurb: "Slide a filter over an image and watch a feature map appear underneath it.",
    status: "planned",
  },
  {
    slug: "pooling",
    part: "Part IV — Architectures",
    chapterNumber: 2,
    title: "Pooling",
    blurb: "Shrink a feature map on purpose, without losing what actually matters in it.",
    status: "planned",
  },
  {
    slug: "a-minimal-cnn",
    part: "Part IV — Architectures",
    chapterNumber: 3,
    title: "A minimal CNN",
    blurb: "Assemble filters and pooling into a real, small, working network.",
    status: "planned",
  },
  {
    slug: "capstone-classify-digits",
    part: "Part IV — Architectures",
    chapterNumber: 4,
    title: "Classify digits, visualize the filters",
    blurb: "Train the minimal CNN live, then look at what its filters actually learned to detect.",
    status: "planned",
    capstone: true,
  },
  {
    slug: "why-sequences-break-feedforward-nets",
    part: "Part IV — Architectures",
    chapterNumber: 5,
    title: "Why sequences break feedforward nets",
    blurb: "Watch a plain network fail on data where order is the whole point.",
    status: "planned",
  },
  {
    slug: "recurrent-neural-networks",
    part: "Part IV — Architectures",
    chapterNumber: 6,
    title: "Recurrent neural networks",
    blurb: "Carry a hidden state forward, one token at a time, through a sequence.",
    status: "planned",
  },
  {
    slug: "vanishing-gradients-and-lstms",
    part: "Part IV — Architectures",
    chapterNumber: 7,
    title: "Vanishing gradients in RNNs, and LSTMs",
    blurb: "Watch gates rescue a memory that plain recurrence would have forgotten.",
    status: "planned",
  },
  {
    slug: "word-embeddings",
    part: "Part IV — Architectures",
    chapterNumber: 8,
    title: "Word embeddings",
    blurb: "Turn words into vectors, then find their nearest neighbors in meaning.",
    status: "planned",
  },
  {
    slug: "tokenization",
    part: "Part IV — Architectures",
    chapterNumber: 9,
    title: "Tokenization",
    blurb: "See exactly how a sentence gets cut into the numbers a model actually sees.",
    status: "planned",
  },
  {
    slug: "attention",
    part: "Part IV — Architectures",
    chapterNumber: 10,
    title: "Attention",
    blurb: "Let a model look at an entire sequence at once, not just its previous neighbor.",
    status: "planned",
  },
  {
    slug: "self-attention-and-multi-head-attention",
    part: "Part IV — Architectures",
    chapterNumber: 11,
    title: "Self-attention & multi-head attention",
    blurb: "Several attention \"views\" of the same sequence, running in parallel.",
    status: "planned",
  },
  {
    slug: "the-transformer-block",
    part: "Part IV — Architectures",
    chapterNumber: 12,
    title: "The Transformer block",
    blurb: "Assemble attention, a feedforward layer, and residual connections into one block.",
    status: "planned",
  },
  {
    slug: "capstone-generate-text",
    part: "Part IV — Architectures",
    chapterNumber: 13,
    title: "Generate text with a tiny Transformer",
    blurb: "A character-level model, trained and sampled live, one token at a time.",
    status: "planned",
    capstone: true,
  },
  {
    slug: "autoencoders",
    part: "Part IV — Architectures",
    chapterNumber: 14,
    title: "Autoencoders",
    blurb: "Compress data down to a bottleneck, reconstruct it, and see exactly what's lost.",
    status: "planned",
  },
  {
    slug: "generative-adversarial-networks",
    part: "Part IV — Architectures",
    chapterNumber: 15,
    title: "Generative adversarial networks",
    blurb: "Two networks compete — one forges, one detects — and both get better together.",
    status: "planned",
  },
  {
    slug: "diffusion-models",
    part: "Part IV — Architectures",
    chapterNumber: 16,
    title: "Diffusion models",
    blurb: "Generate an image by learning to reverse noise, one small step at a time.",
    status: "planned",
  },

  // ---------- Part V — Explainable AI ----------
  {
    slug: "interpretability-accuracy-tradeoff",
    part: "Part V — Explainable AI",
    chapterNumber: 1,
    title: "The interpretability–accuracy tradeoff",
    blurb: "Why the most accurate model on the leaderboard is often the least explainable.",
    status: "planned",
  },
  {
    slug: "saliency-maps",
    part: "Part V — Explainable AI",
    chapterNumber: 2,
    title: "Saliency maps",
    blurb: "Highlight exactly which pixels actually moved a prediction.",
    status: "planned",
  },
  {
    slug: "grad-cam",
    part: "Part V — Explainable AI",
    chapterNumber: 3,
    title: "Grad-CAM",
    blurb: "See what a CNN was visually \"looking at\" the moment it decided.",
    status: "planned",
  },
  {
    slug: "lime",
    part: "Part V — Explainable AI",
    chapterNumber: 4,
    title: "LIME",
    blurb: "Explain any black-box model by locally approximating it with something simple.",
    status: "planned",
  },
  {
    slug: "shapley-values",
    part: "Part V — Explainable AI",
    chapterNumber: 5,
    title: "Shapley values",
    blurb: "A game-theoretic, provably fair way to split credit among features.",
    status: "planned",
  },
  {
    slug: "shap-for-real-models",
    part: "Part V — Explainable AI",
    chapterNumber: 6,
    title: "SHAP for real models",
    blurb: "Shapley values made practical and applied to an actual trained classifier.",
    status: "planned",
  },
  {
    slug: "counterfactual-explanations",
    part: "Part V — Explainable AI",
    chapterNumber: 7,
    title: "Counterfactual explanations",
    blurb: "\"What's the smallest change that would have flipped this decision?\"",
    status: "planned",
  },
  {
    slug: "capstone-explain-one-prediction-three-ways",
    part: "Part V — Explainable AI",
    chapterNumber: 8,
    title: "Explain one prediction three ways",
    blurb: "Saliency, SHAP, and a counterfactual on the same case, compared side by side.",
    status: "planned",
    capstone: true,
  },

  // ---------- Part VI — Multimodal AI ----------
  {
    slug: "joint-embedding-spaces",
    part: "Part VI — Multimodal AI",
    chapterNumber: 1,
    title: "Joint embedding spaces",
    blurb: "Put images and text in the same space, and measure the distance between them.",
    status: "planned",
  },
  {
    slug: "contrastive-learning",
    part: "Part VI — Multimodal AI",
    chapterNumber: 2,
    title: "Contrastive learning",
    blurb: "How CLIP-style models learn that shared space without a single hand-written label.",
    status: "planned",
  },
  {
    slug: "cross-attention",
    part: "Part VI — Multimodal AI",
    chapterNumber: 3,
    title: "Cross-attention",
    blurb: "Let one modality directly query another instead of just sharing a space with it.",
    status: "planned",
  },
  {
    slug: "vision-language-models-assembled",
    part: "Part VI — Multimodal AI",
    chapterNumber: 4,
    title: "Vision-language models, assembled",
    blurb: "Put joint embeddings and cross-attention together into one working model.",
    status: "planned",
  },
  {
    slug: "retrieval-augmented-generation",
    part: "Part VI — Multimodal AI",
    chapterNumber: 5,
    title: "Retrieval-augmented generation",
    blurb: "Ground a model's answer in evidence it retrieved a moment before answering.",
    status: "planned",
  },
  {
    slug: "capstone-image-text-search-engine",
    part: "Part VI — Multimodal AI",
    chapterNumber: 6,
    title: "A tiny image–text search engine",
    blurb: "Type a query, retrieve the matching image, using everything from this part.",
    status: "planned",
    capstone: true,
  },
];

export function getChapterMeta(slug: string): ChapterMeta {
  const meta = CURRICULUM.find((c) => c.slug === slug);
  if (!meta) throw new Error(`Unknown chapter slug: ${slug}`);
  return meta;
}

/** Chapters that actually have a page. Prev/next nav is scoped to these only. */
export function getShippedChapters(): ChapterMeta[] {
  return CURRICULUM.filter((c) => c.status === "shipped");
}

export interface ChapterNeighbors {
  index: number;
  prev: ChapterMeta | null;
  next: ChapterMeta | null;
}

export function getChapterNeighbors(slug: string): ChapterNeighbors {
  const shipped = getShippedChapters();
  const index = shipped.findIndex((c) => c.slug === slug);
  return {
    index,
    prev: index > 0 ? shipped[index - 1] : null,
    next: index >= 0 && index < shipped.length - 1 ? shipped[index + 1] : null,
  };
}
