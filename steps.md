Next steps: 
- test and possibly add org level as well as user level
- check if context is being provided uneccessarily to a query (e.g. not be edited or added so shouldnt need to be sent every single time a user messages) + double check policy on too many memories and maximum (should be 500 tokens? or might be other implementation/branch that had it)




when you get over a certain amt of tokens (500) then it will start to essnetially pick the most relevant ones based on the embedding there are some potential optimisations:
- Query-similarity cache with stored embeddings + DB triggers
    - If the cache doesnt change and the incoming query is similar to the last query (that had the cosine similarity search) then don't search again (just use the existing memories from last time)
- If the token count of all the memories is less than the cut off I set (500) skip the cosine similarity and return all memories (since it would return it anyway)