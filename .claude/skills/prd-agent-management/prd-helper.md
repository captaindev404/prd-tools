# PRD Command Helper

This file provides the exact command syntax for running PRD commands in this project.

## PRD Executable Location

```
/Users/captaindev404/Code/Github/infinite-stories/tools/prd/target/release/prd
```

## Database Location

```
/Users/captaindev404/Code/Github/infinite-stories/tools/prd.db
```

## Full Command Template

```bash
/Users/captaindev404/Code/Github/infinite-stories/tools/prd/target/release/prd \
  --database /Users/captaindev404/Code/Github/infinite-stories/tools/prd.db \
  <command> [args]
```

## Examples

```bash
# List all tasks
/Users/captaindev404/Code/Github/infinite-stories/tools/prd/target/release/prd \
  --database /Users/captaindev404/Code/Github/infinite-stories/tools/prd.db \
  list

# Create a task
/Users/captaindev404/Code/Github/infinite-stories/tools/prd/target/release/prd \
  --database /Users/captaindev404/Code/Github/infinite-stories/tools/prd.db \
  create "Task title" --priority high

# Show task details
/Users/captaindev404/Code/Github/infinite-stories/tools/prd/target/release/prd \
  --database /Users/captaindev404/Code/Github/infinite-stories/tools/prd.db \
  show "#42"
```

## Shorter Version (from project root)

From `/Users/captaindev404/Code/Github/infinite-stories/`:

```bash
./tools/prd/target/release/prd --database tools/prd.db <command> [args]
```
