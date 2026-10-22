export function validateConversation(answer:string){
 // Guidance is not a route for model-invented records, links or action confirmations.
 if(/https?:\/\/|www\.|javascript:|<\/?[a-z][^>]*>|```|\bSO-[A-Z0-9-]+|\bAPT-[A-Z0-9-]+/i.test(answer))throw new Error('Unsafe guidance format');
 if(/(?:RM|MYR|\$)\s*\d|\b\d+\s+(?:orders?|appointments?|customers?|sets?|pcs|litres?|units?)\b/i.test(answer))throw new Error('Record or price claim in general guidance');
 if(/\bI(?:'ve| have)?\s+(?:successfully\s+)?(?:saved|created|deleted|purchased|bought|booked|approved|updated|scheduled|diagnosed)\b|\byour\s+.{0,25}\b(?:is|has been)\s+(?:confirmed|booked|diagnosed|approved)\b/i.test(answer))throw new Error('Unsupported action claim');
 return answer;
}
