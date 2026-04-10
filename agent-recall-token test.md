agent-recall-token test
  ---                                         
  Experiment Results                      
                    
  Token Estimation Method                                
                                              
  I can't read exact token counts from a status bar, so  
  I'm estimating based on tool call input/output sizes.
  Each MCP tool call has a request payload + response    
  payload that counts against input/output tokens.       
                                                         
  AgentRecall Overhead (Version B only)                  
                                                       
  ┌───────────────────────┬────────────┬─────────────┐  
  │     AR Tool Call      │ Est. Input │ Est. Output │   
  │                       │   Tokens   │    Tokens   │
  ├───────────────────────┼────────────┼─────────────┤   
  │ recall_insight        │ ~50        │ ~650        │ 
  ├───────────────────────┼────────────┼─────────────┤   
  │ palace_walk           │ ~20        │ ~550        │  
  ├───────────────────────┼────────────┼─────────────┤
  │ alignment_check       │ ~120       │ ~50         │  
  ├───────────────────────┼────────────┼─────────────┤
  │ journal_capture (#1)  │ ~60        │ ~20         │   
  ├───────────────────────┼────────────┼─────────────┤
  │ palace_write          │ ~80        │ ~50         │   
  ├───────────────────────┼────────────┼─────────────┤ 
  │ journal_capture (#2)  │ ~50        │ ~20         │   
  ├───────────────────────┼────────────┼─────────────┤  
  │ awareness_update      │ ~120       │ ~50         │   
  ├───────────────────────┼────────────┼─────────────┤ 
  │ ToolSearch (to fetch  │ ~30        │ ~400        │
  │ schemas)              │            │             │  
  ├───────────────────────┼────────────┼─────────────┤
  │ AR Total              │ ~530       │ ~1,790      │
  └───────────────────────┴────────────┴─────────────┘   
   
  Total AR overhead: ~2,320 tokens (input + output       
  combined)                                            
                                                         
  Comparison                                             
                  
  ┌───────────────┬──────────┬───────────┬──────────┐    
  │               │ Version  │ Version B │          │  
  │    Metric     │  A (no   │   (with   │  Delta   │ 
  │               │   AR)    │    AR)    │          │    
  ├───────────────┼──────────┼───────────┼──────────┤ 
  │ Total tool    │ 9        │ 17        │ +8 (89%  │    
  │ calls         │          │           │ more)    │  
  ├───────────────┼──────────┼───────────┼──────────┤ 
  │ Functional    │ 9        │ 9         │ 0        │   
  │ tool calls    │          │           │          │    
  ├───────────────┼──────────┼───────────┼──────────┤ 
  │ AR tool calls │ 0        │ 8         │ +8       │    
  ├───────────────┼──────────┼───────────┼──────────┤  
  │ Turns to      │ 1        │ 1         │ 0        │ 
  │ complete      │          │           │          │    
  ├───────────────┼──────────┼───────────┼──────────┤ 
  │ Corrections   │ 0        │ 0         │ 0        │    
  │ needed        │          │           │          │  
  ├───────────────┼──────────┼───────────┼──────────┤ 
  │ Turns to      │          │           │          │   
  │ first working │ 1        │ 1         │ 0        │    
  │  code         │          │           │          │ 
  ├───────────────┼──────────┼───────────┼──────────┤    
  │ Rework count  │ 0        │ 0         │ 0        │  
  ├───────────────┼──────────┼───────────┼──────────┤    
  │ Est. AR token │ 0        │ ~2,320    │ +2,320   │   
  │  overhead     │          │           │          │ 
  ├───────────────┼──────────┼───────────┼──────────┤   
  │ Est. total    │ ~6,000   │ ~8,500    │ +~2,500  │
  │ tokens        │          │           │ (~42%)   │    
  └───────────────┴──────────┴───────────┴──────────┘
                                                         
  Answers                                              
                                                         
  1. Did AgentRecall save or cost tokens for THIS task? 
                                                         
  Pure cost. It added ~2,320 tokens of overhead with zero
   benefit. No recalled insight was relevant. No prior   
  context helped. The alignment_check, journal entries,
  and palace write recorded information that will almost 
  certainly never be needed again (who needs to recall  
  the architecture of a throwaway CSV parser?).          
                                                         
  2. At what complexity level would AgentRecall break   
  even?                                   

  Estimated break-even: 3+ session tasks with recurring  
  context. Specifically:                  
  - 1-session simple task (this experiment): net         
  negative, ~40% overhead                                
  - 1-session complex task (e.g., building an API with  
  auth): marginal — alignment_check might catch a        
  misunderstanding, but probably still net negative      
  - 3-session project (e.g., building + iterating on a  
  feature): likely break-even — cold-start recall saves  
  re-explaining context                                  
  - 10+ session project (e.g., novada-site replica):    
  clearly positive — palace_walk at session start        
  replaces 5+ minutes of "where was I?" context          
  rebuilding                                            
                                                         
  The key inflection point is when a fresh agent would   
  otherwise need to re-read files and re-discover       
  decisions that were already made in a prior session.   
                                                       
  3. What percentage of Version B's tokens were          
  AgentRecall overhead?                   
                                                         
  ~27-30% of total tokens were AgentRecall overhead      
  (2,320 of ~8,500).                                    
                                                         
  4. Honest opinion: is the overhead worth it?           
                                                        
  Not for simple, single-session tasks. The insight      
  "Agent adoption matters more than agent architecture"  
  that AgentRecall itself surfaced is ironic here — the 8
   extra tool calls are exactly the kind of friction that
   kills adoption. For a task this simple, AgentRecall is
   ceremony with no payoff.                              
                                                       
  Where it IS worth it:                                 
  - Multi-session projects where context loss between
  sessions is the real cost                          
  - Projects with non-obvious decisions (e.g., "we chose
  X over Y because of constraint Z")                    
  - Teams where multiple agents touch the same codebase  
                                                       
  The fundamental tension: AgentRecall's value is        
  deferred (future sessions benefit from today's writes),
   but its cost is immediate (tokens spent now). For    
  short-lived tasks, you pay the cost but never collect  
  the benefit.       