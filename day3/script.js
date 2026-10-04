console.log("Hello, World!");
let notes=[
    {id:1, text:"Buy milk and bread", category:"personal"},
    {id:2, text:"Finish the Day 3 Assignment", category:"study"},
    {id:3, text:"Call mom", category:"personal"},
    {id:4, text:"Read javascript chapter 4", category:"study"}

]
function searchNotes(word){
    let result=notes.filter(note=> note.text.toLowerCase().includes(word.toLowerCase()))
    return result;
}
console.log(searchNotes("milk"));

function longestNote(){
    let longest=notes.reduce((prev, current)=>{
        return (prev.text.length>current.text.length)? prev:current;
    })
    return longest;
}
console.log(longestNote());

function countByCategory(category){
    const count={}
    for(let note of notes){
        if(note.category===category && count[note.category]){
                count[note.category]++;
            }else{
                count[note.category]=1;
            }
        }
        return count;
    }
    console.log(countByCategory("personal"));

function isDublicate(text){
    let duplicate=notes.some(note=> note.text.toLowerCase()===text.toLowerCase())
    return duplicate;
}
console.log(isDublicate("Buy milk and bread"));

function addNote(text, category){
    const categories=["personal", "study", "work", "other"];
    if(!text || text.length<1 || text.length>200){
        console.log("Invalid note text");
        return false;
        if(isDublicate(text)){
            console.log("Note already exists");
            return false;
        }
    }
    if(!categories.includes(category)){
        console.log("Invalid category");
        return false;
    }
    const newNote={
        id:notes.length+1,
        text:text,category:category
    }
    notes.push(newNote);
    console.log("Note added successfully");
    return true;
    }
    console.log(addNote("Go to the gym", "personal"));