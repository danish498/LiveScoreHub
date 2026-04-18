import { db, pool } from './src/db/db.js';
import { matches, commentary } from './src/db/schema.js';

const dummyMessages = [
  "The referee blows the whistle and we are underway! The atmosphere in the stadium is absolutely electric tonight. Let's see how these two teams fare against each other in this crucial encounter.",
  "An incredible run down the flank! The winger dodges two defenders with breathtaking skill before whipping a dangerous cross into the box, but it's frantically cleared away by the desperate defense.",
  "A harsh challenge near the center circle results in a free kick. The referee reaches to his pocket and shows a yellow card for that reckless tackle. The player argues, but the decision stands.",
  "What an unbelievable strike! A powerful, curling shot from way outside the penalty area narrowly misses the top corner of the net. The goalkeeper was rooted to the spot. Spectacular effort!",
  "The match is temporarily paused due to a suspected injury. Medical staff are quickly onto the field attending to the player down on the turf. The crowd goes completely silent as they nervously watch on.",
  "Wonderful build-up play from the midfield. A string of quick, precise passes completely opens up the opposing defense. A through ball finds the striker, but the flag is up for offside. So close!",
  "A brilliant piece of defending! The center-back reads the play perfectly, making a crucial interception just as the forward was about to pull the trigger. That could have been a certain goal.",
  "The manager is making a tactical substitution to try and shake things up. The new player comes on to loud applause from the fans, hoping to make an immediate impact on this highly contested match.",
  "The crowd erupts as the team wins a corner kick. The tall defenders make their way up into the penalty area, hoping to get on the end of the cross. A great opportunity to score!"
];

async function seed() {
  console.log('Fetching matches...');
  const allMatches = await db.select().from(matches);
  
  if (allMatches.length === 0) {
    console.log('No matches found in the database. Please add some matches first.');
    await pool.end();
    process.exit(0);
  }
  
  console.log(`Found ${allMatches.length} matches. Connecting and adding commentary in bulk...`);
  
  const commentaryToInsert = [];
  
  for (const match of allMatches) {
    // Generate 5 to 8 random commentary entries for each match
    const numComments = Math.floor(Math.random() * 4) + 5; 
    let currentMinute = 1;

    for (let i = 0; i < numComments; i++) {
        const randomMsg = dummyMessages[Math.floor(Math.random() * dummyMessages.length)];
        
        // Ensure chronological progression of minutes roughly
        currentMinute += Math.floor(Math.random() * 10) + 1; 
        if (currentMinute > 90) currentMinute = 90;

        commentaryToInsert.push({
            matchId: match.id,
            minute: currentMinute,
            message: `[Min ${currentMinute}'] ${randomMsg}`,
            createdAt: new Date()
        });
    }
  }

  // Insert all entries
  if (commentaryToInsert.length > 0) {
     console.log(`Inserting ${commentaryToInsert.length} long commentary records...`);
     await db.insert(commentary).values(commentaryToInsert);
     console.log(`Successfully completed seeding!`);
  }
  
  await pool.end();
}

seed().catch(err => {
  console.error('Failed to seed:', err);
  process.exit(1);
});
