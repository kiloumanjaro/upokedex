// Manages pagination state: offset, loading flag, total count, and completion tracking
import { BATCH_SIZE } from '../config/app.config.js';

let offset     = 0;
let isLoading  = false;
let allLoaded  = false;
let totalCount = 0;

export function getOffset()     { return offset; }
export function getIsLoading()  { return isLoading; }
export function getAllLoaded()   { return allLoaded; }
export function getTotalCount() { return totalCount; }

export function setLoading(v)    { isLoading = v; }
export function setTotalCount(n) { totalCount = n; }
export function markAllLoaded()  { allLoaded = true; }
export function advanceOffset()  { offset += BATCH_SIZE; }
