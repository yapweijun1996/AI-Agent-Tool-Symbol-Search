# Benchmark baseline

| Field | Value |
|---|---|
| Status | Active |
| Owner | Project maintainers |
| Last reviewed | 2026-09-07 |

This report records reproducible local measurements from generated TypeScript fixtures. It is evidence, not a latency or memory guarantee. Each warm run is a second in-memory operation in the same process; V1 has no persistent disk cache.

- Node.js: v23.10.0
- Resolver: TypeScript compiler API
- Fixture generation: deterministic file and symbol counts in `scripts/benchmark.mjs`

## small

- Fixture: 5 files × 10 symbols
- Cold: files=5; bytes=4080; time_ms=265.152; memory_bytes=110182400; matches=50; truncation=none; status=complete
- Warm: files=5; bytes=4080; time_ms=178.461; memory_bytes=55099392; matches=50; truncation=none; status=complete

## medium

- Fixture: 40 files × 25 symbols
- Cold: files=40; bytes=83780; time_ms=199.578; memory_bytes=43040768; matches=500; truncation=MAX_RESULTS_REACHED; status=partial
- Warm: files=40; bytes=83780; time_ms=189.804; memory_bytes=86835200; matches=500; truncation=MAX_RESULTS_REACHED; status=partial

## large

- Fixture: 160 files × 50 symbols
- Cold: files=160; bytes=685780; time_ms=395.653; memory_bytes=84115456; matches=500; truncation=MAX_RESULTS_REACHED; status=partial
- Warm: files=160; bytes=685780; time_ms=370.716; memory_bytes=6619136; matches=500; truncation=MAX_RESULTS_REACHED; status=partial
