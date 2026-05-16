// Aggregator that pulls every theme bundle through vanilla-extract.
// `.css.ts` files importing other `.css.ts` files is the path VE's
// transformer expects; importing the bundles from a plain `.ts` got
// tree-shaken by Rollup despite the `sideEffects` whitelist.
import './bundles/blue.css';
import './bundles/brown.css';
import './bundles/cyan.css';
import './bundles/indigo.css';
import './bundles/iris.css';
import './bundles/jade.css';
import './bundles/orange.css';
import './bundles/pink.css';
import './bundles/plum.css';
import './bundles/purple.css';
import './bundles/sky.css';
import './bundles/teal.css';
import './bundles/violet.css';
