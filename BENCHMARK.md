# Benchmark baseline

| Field | Value |
|---|---|
| Status | Active |
| Owner | Project maintainers |
| Last reviewed | 2026-09-07 |

This report records reproducible local measurements from generated TypeScript fixtures. It is evidence, not a latency or memory guarantee. Each warm run is a second in-memory operation in the same process; V1 has no persistent disk cache.

- Package version: 0.1.0
- Node.js: v23.10.0
- Resolver: TypeScript compiler API
- Fixture generation: deterministic file and symbol counts in `scripts/benchmark.mjs`

## small

- Fixture: 5 files × 10 symbols
- Cold: files=5; bytes=4080; time_ms=264.562; memory_bytes=110264320; matches=50; truncation=none; status=complete
- Warm: files=5; bytes=4080; time_ms=175.964; memory_bytes=54820864; matches=50; truncation=none; status=complete

## medium

- Fixture: 40 files × 25 symbols
- Cold: files=40; bytes=83780; time_ms=190.717; memory_bytes=44761088; matches=500; truncation=MAX_RESULTS_REACHED; status=partial
- Warm: files=40; bytes=83780; time_ms=176.042; memory_bytes=88244224; matches=500; truncation=MAX_RESULTS_REACHED; status=partial

## large

- Fixture: 160 files × 50 symbols
- Cold: files=160; bytes=685780; time_ms=385.123; memory_bytes=88244224; matches=500; truncation=MAX_RESULTS_REACHED; status=partial
- Warm: files=160; bytes=685780; time_ms=364.05; memory_bytes=6602752; matches=500; truncation=MAX_RESULTS_REACHED; status=partial
