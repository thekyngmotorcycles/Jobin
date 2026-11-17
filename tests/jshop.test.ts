import assert from "node:assert/strict";
import test from "node:test";
import {DEFAULT_JSHOP_FILTERS,JSHOP_CATEGORIES,filterJShopListings,formatJShopPrice,parseJShopPrice,type JShopListing} from "../src/lib/jshop-model.ts";
const listing=(id:string,price:number,category:JShopListing["category"],city:string,createdAt:number):JShopListing=>({
 id,title:"Artículo "+id,description:"Artículo profesional",category,condition:"Usado",price,currency:"USD",location:city,
 photos:[],createdAt,updatedAt:createdAt,sellerId:"owner",sellerName:"Tienda",sellerHandle:"tienda",status:"published"
});
test("JShop filters listings by category, location and name",()=>{
 const list=[listing("A",120,"Herramientas","Lima",2),listing("B",70,"Tecnología","Miami",1)];
 assert.equal(filterJShopListings(list,{...DEFAULT_JSHOP_FILTERS,category:"Herramientas"}).length,1);
 assert.equal(filterJShopListings(list,{...DEFAULT_JSHOP_FILTERS,location:"MIAMI"})[0].id,"B");
 assert.equal(filterJShopListings(list,{...DEFAULT_JSHOP_FILTERS,query:"artículo a"})[0].id,"A");
 assert.equal(JSHOP_CATEGORIES[0],"Todo");
});
test("JShop sorts non-mutatively by recent or price",()=>{
 const list=[listing("B",70,"Tecnología","Miami",1),listing("A",120,"Herramientas","Lima",2)];
 assert.deepEqual(filterJShopListings(list,DEFAULT_JSHOP_FILTERS).map(x=>x.id),["A","B"]);
 assert.deepEqual(filterJShopListings(list,{...DEFAULT_JSHOP_FILTERS,order:"price_low"}).map(x=>x.id),["B","A"]);
 assert.equal(list[0].id,"B");
});
test("JShop prices do not fabricate missing values",()=>{
 assert.equal(formatJShopPrice(null,"USD"),"Precio sin definir");
 assert.equal(parseJShopPrice(""),null);
 assert.equal(parseJShopPrice("13,50"),13.5);
 assert.equal(parseJShopPrice("-1"),null);
});
