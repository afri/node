/*
 * Experimental StratifiedJS runtime for nodejs
 *
 * (c) 2010 Oni Labs, http://onilabs.com
 *
 * This file is generated from several sources which will be published as 
 * opensource under the MIT license or GPL (we haven't decided yet) at some 
 * point (when we get round to cleaning up our build system).
 *
 * For the time being, this file is licensed under the GPL v2, see
 * http://www.gnu.org/licenses/gpl-2.0.html
 */
var token_cfx={};var token_oniE={};function CFException(type,value,line,file){this.type=type;
if(type=="t"&&(value instanceof Error)&&value._oniE!==token_oniE&&line!=="passthrough"){value._oniE=token_oniE;
value.lineNumber=line;
value.fileName=file||"unknown SJS source";
value.stack="";
if(!value.hasOwnProperty('toString'))value.toString=function(){return this.name+": "+this.message+" ("+this.fileName+(this.lineNumber?":"+this.lineNumber:"")+")"}
;
}
this.val=value;
}
exports.CFE=function(type,value){return new CFException(type,value)}
;
var CFETypes={r:"return",b:"break",c:"continue"};CFException.prototype={__oni_cfx:token_cfx,toString:function(){if(this.type in CFETypes)return "Unexpected "+CFETypes[this.type]+" statement";else return "Uncaught internal SJS control flow exception ("+this.type+":: "+this.val+")"}
,mapToJS:function(){if(this.type=="t")throw this.val;else throw this.toString()}
};
var token_ef={};function is_ef(obj){return obj&&obj.__oni_ef}
function setEFProto(t){for(var p in EF_Proto)t[p]=EF_Proto[p];
}
var EF_Proto={toString:function(){return "<suspended SJS>"}
,__oni_ef:token_ef,setChildFrame:function(ef,idx){this.async=true;
this.child_frame=ef;
ef.parent=this;
ef.parent_idx=idx;
}
,abort:function(){return this.child_frame.abort()}
,returnToParent:function(val){if((val&&val.__oni_cfx)){if(val.type=="r"&&this.swallow_r)val=val.val;
if(this.swallow_bc&&(val.type=="b"||val.type=="c"))val=val.val;
}
else if(this.swallow_r){if(is_ef(val))val.swallow_r=true;
else val=undefined;
}
if(this.async){if(this.parent)this.parent.cont(this.parent_idx,val);
else if((val&&val.__oni_cfx))val.mapToJS();
}
else return val}
};var token_dis={};function execIN(node,env){if(typeof node=="function"){try{return node.call(env.tobj,env.aobj)}
catch(e){return new CFException("t",e,0,env.file)}
}
else if(!node||node.__oni_dis!=token_dis){return node}
return node.exec(node.ndata,env)}
exports.exec=function(node,argsobj,thisobj,filename){var rv=execIN(node,new Env(argsobj,thisobj||this,filename));if((rv&&rv.__oni_cfx))return rv.mapToJS();return rv}
;
exports.exnm=function(node,argsobj,thisobj,filename){return execIN(node,new Env(argsobj,thisobj||this,filename))}
;
exports.exseq=function(aobj,tobj,file,args){var rv=I_seq(args,new Env(aobj,tobj,file));if((rv&&rv.__oni_cfx))return rv.mapToJS();return rv}
;
function makeINCtor(exec){return function(){return {exec:exec,ndata:arguments,__oni_dis:token_dis}}
}
function Env(aobj,tobj,file){this.aobj=aobj;
this.tobj=tobj;
this.file=file;
}
function I_nblock(ndata,args){try{return (ndata[0]).call(args.tobj,args.aobj)}
catch(e){return new CFException("t",e,ndata[1],args.file)}
}
exports.Nb=makeINCtor(I_nblock);
function I_lit(ndata,args){return ndata[0]}
exports.Lit=makeINCtor(I_lit);
function EF_Seq(ndata,args){this.ndata=ndata;
this.args=args;
this.swallow_r=ndata[0]&1;
this.sc=ndata[0]&(2|4);
}
setEFProto(EF_Seq.prototype={});
EF_Seq.prototype.cont=function(idx,val){if(is_ef(val)){this.setChildFrame(val,idx);
}
else if((val&&val.__oni_cfx)){return this.returnToParent(val)}
else{while(idx<this.ndata.length){if(this.sc&&idx>1){if(this.sc==2){if(val)break}
else{if(!val)break}
}
this.child_frame=null;
val=execIN(this.ndata[idx],this.args);
if(this.aborted){if(is_ef(val))val=val.abort();
break}
if(++idx==this.ndata.length||(val&&val.__oni_cfx)){break}
if(is_ef(val)){this.setChildFrame(val,idx);
return this}
}
return this.returnToParent(val)}
}
;
EF_Seq.prototype.abort=function(){if(!this.child_frame){this.aborted=true;
return this}
else return this.child_frame.abort()}
;
function I_seq(ndata,args){return (new EF_Seq(ndata,args)).cont(1)}
exports.Seq=makeINCtor(I_seq);
function EF_Scall(ndata,args){this.ndata=ndata;
this.args=args;
this.i=2;
this.pars=[];
}
setEFProto(EF_Scall.prototype={});
EF_Scall.prototype.cont=function(idx,val){if(is_ef(val)){this.setChildFrame(val,idx);
}
else if((val&&val.__oni_cfx)){return this.returnToParent(val)}
else{if(idx==1){this.pars.push(val);
}
var rv;while(this.i<this.ndata.length){rv=execIN(this.ndata[this.i],this.args);
++this.i;
if((rv&&rv.__oni_cfx))return this.returnToParent(rv);if(is_ef(rv)){this.setChildFrame(rv,1);
return this}
this.pars.push(rv);
}
try{rv=this.ndata[1].apply(this.args.tobj,this.pars);
}
catch(e){rv=new CFException("t",e,this.ndata[0],this.args.file);
}
return this.returnToParent(rv)}
}
;
function I_scall(ndata,args){return (new EF_Scall(ndata,args)).cont(0)}
exports.Scall=makeINCtor(I_scall);
function testIsFunction(f){if(typeof f=="function")return true;return ((""+f).indexOf("[")!=-1)}
function EF_Fcall(ndata,args){this.ndata=ndata;
this.args=args;
this.i=2;
this.pars=[];
}
setEFProto(EF_Fcall.prototype={});
EF_Fcall.prototype.cont=function(idx,val){if(is_ef(val)){this.setChildFrame(val,idx);
}
else if((val&&val.__oni_cfx)){return this.returnToParent(val)}
else if(idx==2){return this.returnToParent(this.o)}
else{if(idx==1){if(this.i==3)this.l=val;
else this.pars.push(val);
}
var rv;while(this.i<this.ndata.length){rv=execIN(this.ndata[this.i],this.args);
++this.i;
if((rv&&rv.__oni_cfx))return this.returnToParent(rv);if(is_ef(rv)){this.setChildFrame(rv,1);
return this}
if(this.i==3)this.l=rv;
else this.pars.push(rv);
}
try{switch(this.ndata[0]){case 0:if(typeof this.l=="function")rv=this.l.apply(this.args.tobj,this.pars);
else if(!testIsFunction(this.l)){rv=new CFException("t",new Error("'"+this.l+"' is not a function"),this.ndata[1],this.args.file);
}
else{var command="this.l(";for(var i=0;i<this.pars.length;++i){if(i)command+=",";
command+="this.pars["+i+"]";
}
command+=")";
rv=eval(command);
}
break;case 1:if(!this.l[0]){rv=new CFException("t",new Error("'"+this.l[1]+"' on '"+this.l[0]+"' is not a function"),this.ndata[1],this.args.file);
}
else if(typeof this.l[0][this.l[1]]=="function"){rv=this.l[0][this.l[1]].apply(this.l[0],this.pars);
}
else if(!testIsFunction(this.l[0][this.l[1]])){rv=new CFException("t",new Error("'"+this.l[0][this.l[1]]+"' is not a function"),this.ndata[1],this.args.file);
}
else{var command="this.l[0][this.l[1]](";for(var i=0;i<this.pars.length;++i){if(i)command+=",";
command+="this.pars["+i+"]";
}
command+=")";
rv=eval(command);
}
break;case 2:var ctor=this.l;if(!testIsFunction(ctor)){rv=new CFException("t",new Error("'"+ctor+"' is not a function"),this.ndata[1],this.args.file);
}
else if(/\{ \[native code\] \}$/.exec(ctor.toString())){var command="new ctor(";for(var i=0;i<this.pars.length;++i){if(i)command+=",";
command+="this.pars["+i+"]";
}
command+=")";
rv=eval(command);
}
else{this.o=Object.create(ctor.prototype);
rv=ctor.apply(this.o,this.pars);
if(is_ef(rv)){this.setChildFrame(rv,2);
return this}
else rv=this.o;
}
break;default:rv=new CFException("i","Invalid Fcall mode");
}
}
catch(e){rv=new CFException("t",e,this.ndata[1],this.args.file);
}
return this.returnToParent(rv)}
}
;
function I_fcall(ndata,args){return (new EF_Fcall(ndata,args)).cont(0)}
exports.Fcall=makeINCtor(I_fcall);
function EF_If(ndata,args){this.ndata=ndata;
this.args=args;
}
setEFProto(EF_If.prototype={});
EF_If.prototype.cont=function(idx,val){switch(idx){case 0:val=execIN(this.ndata[0],this.args);
case 1:if((val&&val.__oni_cfx))break;if(is_ef(val)){this.setChildFrame(val,1);
return this}
if(val)val=execIN(this.ndata[1],this.args);
else val=execIN(this.ndata[2],this.args);
break;default:val=new CFException("i","invalid state in EF_If");
}
return this.returnToParent(val)}
;
function I_if(ndata,args){return (new EF_If(ndata,args)).cont(0)}
exports.If=makeINCtor(I_if);
var Default={};exports.Default=Default;
function EF_Switch(ndata,args){this.ndata=ndata;
this.args=args;
this.phase=0;
}
setEFProto(EF_Switch.prototype={});
EF_Switch.prototype.swallow_bc=true;
EF_Switch.prototype.cont=function(idx,val){switch(this.phase){case 0:if(idx==0){val=execIN(this.ndata[0],this.args);
}
if((val&&val.__oni_cfx))return this.returnToParent(val);if(is_ef(val)){this.setChildFrame(val,1);
return this}
this.phase=1;
this.testval=val;
idx=-1;
case 1:while(true){if(idx>-1){if((val&&val.__oni_cfx))return this.returnToParent(val);if(is_ef(val)){this.setChildFrame(val,idx);
return this}
else if(val==Default||val==this.testval)break}
if(++idx>=this.ndata[1].length)return this.returnToParent(null);val=execIN(this.ndata[1][idx][0],this.args);
}
this.phase=2;
val=0;
case 2:while(idx<this.ndata[1].length){if(is_ef(val)){this.setChildFrame(val,idx);
return this}
if((val&&val.__oni_cfx)){return this.returnToParent(val)}
val=execIN(this.ndata[1][idx][1],this.args);
++idx;
}
if(is_ef(val))val.swallow_bc=true;
return this.returnToParent(val);default:throw "Invalid phase in Switch SJS node"}
}
;
function I_switch(ndata,args){return (new EF_Switch(ndata,args)).cont(0)}
exports.Switch=makeINCtor(I_switch);
function EF_Try(ndata,args){this.ndata=ndata;
this.args=args;
this.state=0;
}
setEFProto(EF_Try.prototype={});
EF_Try.prototype.cont=function(idx,val){if(is_ef(val)){this.setChildFrame(val,this.state);
}
else{switch(this.state){case 0:this.state=1;
val=execIN(this.ndata[1],this.args);
if(is_ef(val)){this.setChildFrame(val);
return this}
case 1:this.state=2;
if(!this.aborted&&this.ndata[2]&&(((val&&val.__oni_cfx)&&val.type=="t")||this.ndata[0]&1)){try{var v;if(this.ndata[0]&1){v=(val&&val.__oni_cfx)?[val.val,true]:[val,false];
}
else v=val.val;
val=this.ndata[2].apply(this.args.tobj,[this.args.aobj,v]);
}
catch(e){val=new CFException("t",e);
}
if(is_ef(val)){this.setChildFrame(val);
return this}
}
case 2:this.state=3;
this.rv=val;
if(this.aborted&&this.ndata[4]){val=execIN(this.ndata[4],this.args);
if(is_ef(val)){this.setChildFrame(val);
return this}
}
case 3:this.state=4;
if(this.ndata[3]){val=execIN(this.ndata[3],this.args);
if(is_ef(val)){this.setChildFrame(val);
return this}
}
case 4:if((this.rv&&this.rv.__oni_cfx)&&!(val&&val.__oni_cfx)){val=this.rv;
}
break;default:val=new CFException("i","invalid state in CF_Try");
}
return this.returnToParent(val)}
}
;
EF_Try.prototype.abort=function(){delete this.parent;
this.aborted=true;
if(this.state!=4){var val=this.child_frame.abort();if(is_ef(val)){this.setChildFrame(val);
}
else{if(this.cont(0,undefined)!=this)return}
}
return this}
;
function I_try(ndata,args){return (new EF_Try(ndata,args)).cont(0)}
exports.Try=makeINCtor(I_try);
function EF_Loop(ndata,args){this.ndata=ndata;
this.args=args;
}
setEFProto(EF_Loop.prototype={});
EF_Loop.prototype.cont=function(idx,val){if(is_ef(val)){this.setChildFrame(val,idx);
}
else{while(true){if(idx==0){if((val&&val.__oni_cfx)){return this.returnToParent(val)}
val=execIN(this.ndata[1],this.args);
if(is_ef(val)){this.setChildFrame(val,2);
return this}
idx=2;
}
if(idx>1){if(idx==2){if(!val||(val&&val.__oni_cfx)){return this.returnToParent(val)}
}
while(1){if(idx>2){if((val&&val.__oni_cfx)){if(val.type=="b"){val=undefined;
}
else if(val.type=="c"){val=undefined;
break}
return this.returnToParent(val)}
if(idx>=this.ndata.length)break}
val=execIN(this.ndata[idx+1],this.args);
++idx;
if(is_ef(val)){this.setChildFrame(val,idx);
return this}
}
idx=1;
}
if(this.ndata[2]){val=execIN(this.ndata[2],this.args);
if(is_ef(val)){this.setChildFrame(val,0);
return this}
}
idx=0;
}
}
}
;
function I_loop(ndata,args){return (new EF_Loop(ndata,args)).cont(ndata[0],true)}
exports.Loop=makeINCtor(I_loop);
function EF_ForIn(ndata,args){this.ndata=ndata;
this.args=args;
}
setEFProto(EF_ForIn.prototype={});
EF_ForIn.prototype.cont=function(idx,val){if(is_ef(val)){this.setChildFrame(val,idx);
}
else{if(idx==0){val=execIN(this.ndata[0],this.args);
if(is_ef(val)){this.setChildFrame(val,1);
return this}
idx=1;
}
if(idx==1){if((val&&val.__oni_cfx))return this.returnToParent(val);for(var x in val){if(this.remainingX===undefined){val=this.ndata[1].apply(this.args.tobj,[this.args.aobj,x]);
if((val&&val.__oni_cfx)){if(val.type=="b"){val=undefined;
}
else if(val.type=="c"){val=undefined;
continue}
return this.returnToParent(val)}
if(is_ef(val))this.remainingX=[];
}
else this.remainingX.push(x);
}
if(is_ef(val)){if(!this.remainingX.length){val.swallow_bc=true;
return this.returnToParent(val)}
else{this.setChildFrame(val,2);
return this}
}
return this.returnToParent(val)}
if(idx==2){while(1){if((val&&val.__oni_cfx)){if(val.type=="b"){val=undefined;
}
else if(val.type=="c"){val=undefined;
if(this.remainingX.length)continue}
return this.returnToParent(val)}
if(!this.remainingX.length){if(is_ef(val))val.swallow_bc=true;
return this.returnToParent(val)}
val=this.ndata[1].apply(this.args.tobj,[this.args.aobj,this.remainingX.shift()]);
if(is_ef(val)){this.setChildFrame(val,2);
return this}
}
}
}
}
;
function I_forin(ndata,args){return (new EF_ForIn(ndata,args)).cont(0)}
exports.ForIn=makeINCtor(I_forin);
function I_cfe(ndata,args){return new CFException(ndata[0],ndata[1])}
exports.Cfe=makeINCtor(I_cfe);
function EF_Par(ndata,args){this.ndata=ndata;
this.args=args;
this.pending=0;
this.children=new Array(this.ndata.length);
}
setEFProto(EF_Par.prototype={});
EF_Par.prototype.cont=function(idx,val){if(is_ef(val)){this.setChildFrame(val,idx);
}
else{if(idx==-1){for(var i=0;i<this.ndata.length;++i){val=execIN(this.ndata[i],this.args);
if(this.aborted){if(is_ef(val)){++this.pending;
this.setChildFrame(val,i);
return this.abortInner()}
return this.pendingCFE}
else if(is_ef(val)){++this.pending;
this.setChildFrame(val,i);
}
else if((val&&val.__oni_cfx)){this.pendingCFE=val;
return this.abortInner()}
}
}
else{--this.pending;
this.children[idx]=undefined;
if((val&&val.__oni_cfx)&&!this.aborted){this.pendingCFE=val;
return this.returnToParent(this.abortInner())}
}
if(this.pending<2){if(!this.pendingCFE){if(this.pending==0)return this.returnToParent(val);for(var i=0;i<this.children.length;++i)if(this.children[i])return this.returnToParent(this.children[i]);return this.returnToParent(new CFException("i","invalid state in Par"))}
else{if(this.pending==0)return this.returnToParent(this.pendingCFE)}
}
this.async=true;
return this}
}
;
EF_Par.prototype.abort=function(){delete this.parent;
if(this.aborted){delete this.pendingCFE;
return this}
return this.abortInner()}
;
EF_Par.prototype.abortInner=function(){this.aborted=true;
for(var i=0;i<this.children.length;++i)if(this.children[i]){var val=this.children[i].abort();if(is_ef(val))this.setChildFrame(val,i);
else{--this.pending;
this.children[i]=undefined;
}
}
if(!this.pending)return this.pendingCFE;this.async=true;
return this}
;
EF_Par.prototype.setChildFrame=function(ef,idx){this.children[idx]=ef;
ef.parent=this;
ef.parent_idx=idx;
}
;
function I_par(ndata,args){return (new EF_Par(ndata,args)).cont(-1)}
exports.Par=makeINCtor(I_par);
function EF_Alt(ndata,args){this.ndata=ndata;
this.args=args;
this.pending=0;
this.children=new Array(this.ndata.length);
}
setEFProto(EF_Alt.prototype={});
EF_Alt.prototype.cont=function(idx,val){if(is_ef(val)){this.setChildFrame(val,idx);
}
else{if(idx==-1){for(var i=0;i<this.ndata.length;++i){val=execIN(this.ndata[i],this.args);
if(this.aborted){if(is_ef(val)){++this.pending;
this.setChildFrame(val,i);
return this.abortInner()}
return this.pendingRV}
else if(is_ef(val)){++this.pending;
this.setChildFrame(val,i);
}
else{this.pendingRV=val;
return this.abortInner()}
}
}
else{--this.pending;
this.children[idx]=undefined;
if(!this.aborted){this.pendingRV=val;
return this.returnToParent(this.abortInner())}
if(this.pending==0)return this.returnToParent(this.pendingRV)}
this.async=true;
return this}
}
;
EF_Alt.prototype.abort=function(){delete this.parent;
if(this.aborted){delete this.pendingRV;
return this}
return this.abortInner()}
;
EF_Alt.prototype.abortInner=function(){this.aborted=true;
for(var i=0;i<this.children.length;++i)if(this.children[i]){var val=this.children[i].abort();if(is_ef(val))this.setChildFrame(val,i);
else{--this.pending;
this.children[i]=undefined;
}
}
if(!this.pending)return this.pendingRV;this.async=true;
return this}
;
EF_Alt.prototype.setChildFrame=function(ef,idx){this.children[idx]=ef;
ef.parent=this;
ef.parent_idx=idx;
}
;
function I_alt(ndata,args){return (new EF_Alt(ndata,args)).cont(-1)}
exports.Alt=makeINCtor(I_alt);
function EF_Suspend(ndata,args){this.ndata=ndata;
this.args=args;
}
setEFProto(EF_Suspend.prototype={});
EF_Suspend.prototype.cont=function(idx,val){if(is_ef(val)){this.setChildFrame(val,idx);
}
else{switch(idx){case 0:try{var ef=this;var resumefunc=function(){ef.cont(2,arguments);
}
;val=this.ndata[0].apply(this.args.tobj,[this.args.aobj,resumefunc]);
}
catch(e){val=new CFException("t",e);
}
if(this.returning){if(is_ef(val)){this.setChildFrame(val,null);
val=this.abort();
if(is_ef(val)){this.setChildFrame(val,3);
this.async=true;
return this}
}
return this.cont(3,null)}
if(is_ef(val)){this.setChildFrame(val,1);
return this}
case 1:if((val&&val.__oni_cfx)){this.returning=true;
break}
this.suspendCompleted=true;
this.async=true;
return this;case 2:if(this.returning){return}
this.returning=true;
if((val&&val.__oni_cfx)){val=new CFException("i","Suspend: Resume function threw ("+val.toString()+")");
break}
this.retvals=val;
if(!this.suspendCompleted){if(!this.child_frame){this.returning=true;
return}
else{val=this.abort();
if(is_ef(val)){this.setChildFrame(val,3);
return this}
}
}
case 3:try{this.ndata[1].apply(this.args,this.retvals);
val=undefined;
}
catch(e){val=new CFException("i","Suspend: Return function threw ("+e+")");
}
break;default:val=new CFException("i","Invalid state in Suspend ("+idx+")");
}
return this.returnToParent(val)}
}
;
EF_Suspend.prototype.abort=function(){this.returning=true;
if(!this.suspendCompleted)return this.child_frame.abort()}
;
function I_sus(ndata,args){return (new EF_Suspend(ndata,args)).cont(0)}
exports.Suspend=makeINCtor(I_sus);
function dummy(){}
exports.Hold=function(){if(!arguments.length)return {__oni_ef:token_ef,abort:dummy};var sus={__oni_ef:token_ef,abort:function(){sus=null;
clearTimeout(this.co);
}
};sus.co=setTimeout(function(){if(sus&&sus.parent)sus.parent.cont(sus.parent_idx,undefined);
}
,arguments[0]);
return sus}
;
exports.Spawn=function(f,arg,this_obj){this_obj=this_obj||this;
function s(){f.call(this_obj,arg);
}
process.nextTick(s);
}
;
exports.Throw=function(exp,line,file){return new CFException("t",exp,line,file)}
;
exports.Arr=function(){return Array.prototype.slice.call(arguments,0)}
;
exports.Obj=function(){var obj=new Object();for(var i=0;i<arguments[0].length;++i)obj[arguments[0][i]]=arguments[i+1];
return obj}
;
exports.Return=function(exp){return new CFException("r",exp)}
;
exports.With=function(exp,f,argobj){return f(argobj,exp)}
;
exports.infix={'+':function(a,b){return a+b}
,'-':function(a,b){return a-b}
,'*':function(a,b){return a*b}
,'/':function(a,b){return a/b}
,'%':function(a,b){return a%b}
,'<<':function(a,b){return a<<b}
,'>>':function(a,b){return a>>b}
,'>>>':function(a,b){return a>>>b}
,'<':function(a,b){return a<b}
,'>':function(a,b){return a>b}
,'<=':function(a,b){return a<=b}
,'>=':function(a,b){return a>=b}
,'==':function(a,b){return a==b}
,'!=':function(a,b){return a!=b}
,'===':function(a,b){return a===b}
,'!==':function(a,b){return a!==b}
,'&':function(a,b){return a&b}
,'^':function(a,b){return a^b}
,'|':function(a,b){return a|b}
,',':function(a,b){return a,b}
,'instanceof':function(a,b){return a instanceof b}
,'in':function(a,b){return a in b}
};
__oni_rt=exports;(function(exports){function push_decl_scope(pctx){pctx.decl_scopes.push({vars:[],funs:"",fscoped_ctx:0});
}
function pop_decl_scope(pctx){var decls=pctx.decl_scopes.pop();var rv="";if(decls.vars.length)rv+="var "+decls.vars.join(",")+";";
rv+=decls.funs;
return rv}
function top_decl_scope(pctx){return pctx.decl_scopes[pctx.decl_scopes.length-1]}
function push_stmt_scope(pctx){pctx.stmt_scopes.push({seq:[]});
}
function pop_stmt_scope(pctx,pre,post){var seq=pctx.stmt_scopes.pop().seq;var rv="";if(seq.length){if(pctx.nb_ctx==0){if(pre)rv+=pre;
for(var i=0;i<seq.length;++i){var v=seq[i].v();if(v.length){if(i||pre)rv+=",";
rv+=v;
}
}
if(post)rv+=post;
}
else{for(var i=0;i<seq.length;++i)rv+=seq[i].nb();
}
}
return rv}
function top_stmt_scope(pctx){return pctx.stmt_scopes[pctx.stmt_scopes.length-1]}
function begin_script(pctx){if(pctx.filename)pctx.fn=pctx.filename.replace(/'/g,"\\'");
if(pctx.scopes!==undefined)throw "Internal parser error: Nested script";pctx.decl_scopes=[];
pctx.stmt_scopes=[];
pctx.nb_ctx=0;
push_decl_scope(pctx);
push_stmt_scope(pctx);
}
function add_stmt(stmt,pctx){if(!stmt)return;if(stmt.is_compound_stmt){for(var i=0;i<stmt.stmts.length;++i)add_stmt(stmt.stmts[i],pctx);
return}
else if(stmt.is_var_decl){top_decl_scope(pctx).vars.push(stmt.decl());
if(stmt.is_empty)return}
else if(stmt.is_fun_decl){top_decl_scope(pctx).funs+=stmt.decl();
return}
var seq=top_stmt_scope(pctx).seq;if(stmt.is_nblock&&pctx.nb_ctx==0){var last=seq.length?seq[seq.length-1]:null;if(!last||!last.is_nblock_seq){last=new ph_nblock_seq(pctx);
seq.push(last);
}
last.pushStmt(stmt);
}
else seq.push(stmt);
}
function end_script(pctx){var rv="";rv+=pop_decl_scope(pctx);
rv+=pop_stmt_scope(pctx,"__oni_rt.exseq(this.arguments,this,'"+pctx.fn+"',["+0,"])");
return rv}
function pop_block(pctx){if(top_stmt_scope(pctx).seq.length==1){var stmt=pctx.stmt_scopes.pop().seq[0];stmt.is_var_decl=false;
return stmt}
else return new ph_block(pop_stmt_scope(pctx))}
function nblock_val_to_val(v,r,l){var rv="function(arguments){";if(r)rv+="return ";
rv+=v;
return rv+"}"}
function ph(){}
ph.prototype={is_nblock:false,v:function(accept_list){if(this.is_nblock&&this.nblock_val)return nblock_val_to_val(this.nblock_val(),this.is_value,this.line);else return this.val(accept_list)}
,nb:function(){if(this.nblock_val)return this.nblock_val();else throw "Illegal statement in __js block"}
};
function ph_block(seq){this.seq=seq;
}
ph_block.prototype=new ph();
ph_block.prototype.nblock_val=function(){return this.seq}
;
ph_block.prototype.val=function(accept_list){return this.seq.length?(accept_list?this.seq:"__oni_rt.Seq("+0+","+this.seq+")"):"0"}
;
function ph_switch(exp,clauses){this.exp=exp;
this.clauses=clauses;
}
ph_switch.prototype=new ph();
ph_switch.prototype.val=function(){var clauses="["+this.clauses.join(",")+"]";return "__oni_rt.Switch("+this.exp.v()+","+clauses+")"}
;
function ph_fun_exp(fname,pars,body,pctx){this.code="function "+fname+"("+pars.join(",")+"){"+body+"}";
}
ph_fun_exp.prototype=new ph();
ph_fun_exp.prototype.is_nblock=true;
ph_fun_exp.prototype.v=function(){return "__oni_rt.Lit("+this.code+")"}
;
ph_fun_exp.prototype.nblock_val=function(){return this.code}
;
function gen_fun_decl(fname,pars,body,pctx){if(top_decl_scope(pctx).fscoped_ctx){return gen_var_decl([[fname,new ph_fun_exp("",pars,body,pctx)]],pctx)}
else return new ph_fun_decl(fname,pars,body,pctx)}
function ph_fun_decl(fname,pars,body,pctx){this.code="function "+fname+"("+pars.join(",")+"){"+body+"}";
}
ph_fun_decl.prototype=new ph();
ph_fun_decl.prototype.is_fun_decl=true;
ph_fun_decl.prototype.decl=function(){return this.code}
;
function ph_nblock_seq(){this.stmts=[];
}
ph_nblock_seq.prototype=new ph();
ph_nblock_seq.prototype.is_nblock=true;
ph_nblock_seq.prototype.is_nblock_seq=true;
ph_nblock_seq.prototype.pushStmt=function(stmt){this.stmts.push(stmt);
if(this.line===undefined)this.line=this.stmts[0].line;
}
;
ph_nblock_seq.prototype.nblock_val=function(){var rv="";for(var i=0;i<this.stmts.length-1;++i){rv+=this.stmts[i].nb();
}
if(this.stmts[i].is_value)rv+="return ";
rv+=this.stmts[i].nb();
return rv}
;
function ph_compound_stmt(pctx){this.stmts=[];
this.pctx=pctx;
}
ph_compound_stmt.prototype=new ph();
ph_compound_stmt.prototype.is_compound_stmt=true;
ph_compound_stmt.prototype.toBlock=function(){push_stmt_scope(this.pctx);
add_stmt(this,this.pctx);
return pop_block(this.pctx)}
;
function ph_exp_stmt(exp,pctx){this.exp=exp;
this.line=this.exp.line;
this.is_nblock=exp.is_nblock;
}
ph_exp_stmt.prototype=new ph();
ph_exp_stmt.prototype.is_value=true;
ph_exp_stmt.prototype.nblock_val=function(){return this.exp.nb()+";"}
;
ph_exp_stmt.prototype.val=function(){return this.exp.v()}
;
function gen_var_compound(decls,pctx){var rv=new ph_compound_stmt(pctx);for(var i=0;i<decls.length;++i)rv.stmts.push(new ph_var_decl(decls[i],pctx));
return rv}
function gen_var_decl(decls,pctx){return gen_var_compound(decls,pctx).toBlock()}
function ph_var_decl(d,pctx){this.d=d;
this.is_empty=this.d.length<2;
this.line=pctx.line;
if(!this.is_empty)this.is_nblock=d[1].is_nblock;
}
ph_var_decl.prototype=new ph();
ph_var_decl.prototype.is_var_decl=true;
ph_var_decl.prototype.decl=function(){return this.d[0]}
;
ph_var_decl.prototype.nblock_val=function(){;return this.d[0]+"="+this.d[1].nb()+";"}
;
ph_var_decl.prototype.val=function(){;return "__oni_rt.Scall("+this.line+",function(_oniX){return "+this.d[0]+"=_oniX;},"+this.d[1].v()+")"}
;
function ph_if(t,c,a,pctx){this.t=t;
this.c=c;
this.a=a;
this.line=t.line;
this.file=pctx.fn;
this.is_nblock=false;
}
ph_if.prototype=new ph();
ph_if.prototype.nblock_val=function(){var rv="if("+this.t.nb()+"){"+this.c.nb()+"}";if(this.a)rv+="else{"+this.a.nb()+"}";
return rv}
;
ph_if.prototype.val=function(){var rv;var c=this.c?this.c.v():"0";if(this.t.is_nblock){rv="function(arguments){if("+this.t.nb()+")return __oni_rt.exnm("+c+",arguments,this,'"+this.file+"');";
if(this.a)rv+="else return __oni_rt.exnm("+this.a.v()+",arguments,this,'"+this.file+"');";
return rv+"}"}
else{rv="__oni_rt.If("+this.t.v()+","+c;
if(this.a)rv+=","+this.a.v();
return rv+")"}
}
;
function ph_try(block,crf,pctx){this.block=block;
this.crf=crf;
this.file=pctx.fn;
}
ph_try.prototype=new ph();
ph_try.prototype.val=function(){var tb=this.block.v();if(!tb.length)tb="0";
var rv="__oni_rt.Try("+((this.crf[0]&&this.crf[0][2])?1:0);rv+=","+tb;
if(this.crf[0]){var cb=this.crf[0][1].v();rv+=",function(arguments,"+this.crf[0][0]+"){";
if(cb.length)rv+="return __oni_rt.exnm("+cb+",arguments,this,'"+this.file+"')";
rv+="}";
}
else rv+=",0";
if(this.crf[2]){var fb=this.crf[2].v();if(!fb.length)fb="0";
rv+=","+fb;
}
else rv+=",0";
if(this.crf[1]){var rb=this.crf[1].v();if(rb.length)rv+=","+rb;
}
return rv+")"}
;
function ph_throw(exp,pctx){this.exp=exp;
this.line=exp.line;
this.file=pctx.fn;
this.is_nblock=exp.is_nblock;
}
ph_throw.prototype=new ph();
ph_throw.prototype.nblock_val=function(){return "throw "+this.exp.nb()+";"}
;
ph_throw.prototype.val=function(){return "__oni_rt.Scall("+this.line+",__oni_rt.Throw,"+this.exp.v()+","+this.line+",'"+this.file+"')"}
;
function ph_return(exp,pctx){this.line=pctx.line;
this.exp=exp;
this.nb_ctx=pctx.nb_ctx;
this.is_nblock=exp?exp.is_nblock:true;
}
ph_return.prototype=new ph();
ph_return.prototype.nblock_val=function(){var rv;if(this.nb_ctx){rv="return";
if(this.exp)rv+=" "+this.exp.nb()+";";
}
else{rv="return __oni_rt.CFE('r'";
if(this.exp)rv+=","+this.exp.nb();
rv+=");";
}
return rv}
;
ph_return.prototype.val=function(){var v=this.exp?","+this.exp.v():"";return "__oni_rt.Scall("+this.line+",__oni_rt.Return"+v+")"}
;
function ph_cfe(f,lbl){this.f=f;
this.lbl=lbl;
}
ph_cfe.prototype=new ph();
ph_cfe.prototype.val=function(){var l=this.lbl?'"'+this.lbl+'"':"";var rv='__oni_rt.Cfe("'+this.f+'"';if(this.lbl)rv+=',"'+this.lbl+'"';
return rv+")"}
;
function gen_for(init_exp,decls,test_exp,inc_exp,body,pctx){var rv;if(init_exp||decls){if(decls)rv=gen_var_compound(decls,pctx);
else rv=new ph_compound_stmt(pctx);
if(init_exp)rv.stmts.push(init_exp);
rv.stmts.push(new ph_loop(0,test_exp,body,inc_exp));
rv=rv.toBlock();
}
else rv=new ph_loop(0,test_exp,body,inc_exp);
return rv}
function ph_loop(init_state,test_exp,body,inc_exp){this.init_state=init_state;
this.test_exp=test_exp;
this.inc_exp=inc_exp;
this.body=body;
}
ph_loop.prototype=new ph();
ph_loop.prototype.nblock_val=function(){if(this.init_state==2)throw "Can't encode do-while loops as __js yet";if(this.test_exp&&this.inc_exp){return "for(;"+this.test_exp.nb()+";"+this.inc_exp.nb()+"){"+this.body.nb()+"}"}
else if(this.test_exp){return "while("+this.test_exp.nb()+"){"+this.body.nb()+"}"}
else throw "Can't encode this loop as __js yet"}
;
ph_loop.prototype.val=function(){var test=this.test_exp?this.test_exp.v():"1";var body=this.body?this.body.v(true):"0";return "__oni_rt.Loop("+this.init_state+","+test+","+(this.inc_exp?this.inc_exp.v():"0")+","+body+")"}
;
function gen_for_in(lhs_exp,decl,obj_exp,body,pctx){var rv;if(decl){rv=gen_var_compound([decl],pctx);
rv.stmts.push(new ph_for_in(new ph_identifier(decl[0],pctx),obj_exp,body,pctx));
rv=rv.toBlock();
}
else rv=new ph_for_in(lhs_exp,obj_exp,body,pctx);
return rv}
function ph_for_in(lhs,obj,body,pctx){this.lhs=lhs;
this.obj=obj;
this.body=body;
this.pctx=pctx;
}
ph_for_in.prototype=new ph();
ph_for_in.prototype.val=function(){var rv="__oni_rt.ForIn("+this.obj.v();rv+=",function(arguments, _oniY) { return __oni_rt.exnm(__oni_rt.Seq("+0+",";
rv+=(new ph_assign_op(this.lhs,"=",new ph_identifier("_oniY",this.pctx),this.pctx)).v();
if(this.body)rv+=","+this.body.v();
return rv+"), arguments, this,'"+this.pctx.fn+"')})"}
;
function ph_with(exp,body,pctx){this.exp=exp;
this.body=body;
this.line=this.exp.line;
this.file=pctx.fn;
this.is_nblock=exp.is_nblock&&body.is_nblock;
}
ph_with.prototype=new ph();
ph_with.prototype.nblock_val=function(){return "with("+this.exp.nb()+")"+this.body.nb()}
;
ph_with.prototype.val=function(){var rv="__oni_rt.Scall("+this.line+",__oni_rt.With,"+this.exp.v()+", function(arguments, _oniZ){with (_oniZ) return __oni_rt.exnm("+this.body.v()+",arguments,this,'"+this.file+"')})";return rv}
;
function ph_literal(value,pctx,type){this.value=value;
if(type=="<regex>")this.esc_lit=true;
}
ph_literal.prototype=new ph();
ph_literal.prototype.is_nblock=true;
ph_literal.prototype.v=function(){if(this.esc_lit)return "__oni_rt.Lit("+this.value+")";return this.value}
;
ph_literal.prototype.nblock_val=function(){return this.value}
;
function ph_infix_op(left,id,right,pctx){this.left=left;
this.id=id;
this.right=right;
this.line=pctx.line;
this.is_nblock=left.is_nblock&&right.is_nblock;
}
ph_infix_op.prototype=new ph();
ph_infix_op.prototype.is_value=true;
ph_infix_op.prototype.nblock_val=function(){return this.left.nb()+" "+this.id+" "+this.right.nb()}
;
ph_infix_op.prototype.val=function(){if(this.is_nblock){return nblock_val_to_val(this.nb(),true,this.line)}
else if(this.id=="||"){return "__oni_rt.Seq("+2+","+this.left.v()+","+this.right.v()+")"}
else if(this.id=="&&"){return "__oni_rt.Seq("+4+","+this.left.v()+","+this.right.v()+")"}
else return "__oni_rt.Scall("+this.line+",__oni_rt.infix['"+this.id+"'],"+this.left.v()+","+this.right.v()+")"}
;
function ph_assign_op(left,id,right,pctx){if(!left.is_ref&&!left.is_id)throw "Invalid left side in assignment";this.left=left;
this.id=id;
this.right=right;
this.line=pctx.line;
this.is_nblock=left.is_nblock&&right.is_nblock;
}
ph_assign_op.prototype=new ph();
ph_assign_op.prototype.is_value=true;
ph_assign_op.prototype.nblock_val=function(){return this.left.nb()+this.id+this.right.nb()}
;
ph_assign_op.prototype.val=function(){var rv;if(this.is_nblock){rv=nblock_val_to_val(this.nb(),true,this.line);
}
else if(!this.left.is_ref||this.left.is_nblock){rv="__oni_rt.Scall("+this.line+",function(_oniX){return "+this.left.nb()+this.id+"_oniX;},"+this.right.v()+")";
}
else{rv="__oni_rt.Scall("+this.line+",function(l, r){return l[0][l[1]]"+this.id+"r;},"+this.left.ref()+","+this.right.v()+")";
}
return rv}
;
function ph_prefix_op(id,right,pctx){this.id=id;
this.right=right;
this.line=pctx.line;
this.is_nblock=right.is_nblock;
}
ph_prefix_op.prototype=new ph();
ph_prefix_op.prototype.is_value=true;
ph_prefix_op.prototype.nblock_val=function(){return this.id+" "+this.right.nb()}
;
ph_prefix_op.prototype.val=function(){var rv;if(this.right.is_nblock){rv=nblock_val_to_val(this.nb(),true,this.line);
}
else if(this.right.is_ref){rv="__oni_rt.Scall("+this.line+",function(r){return "+this.id+" r[0][r[1]]},"+this.right.ref()+")";
}
else{rv="__oni_rt.Scall("+this.line+",function(r){return "+this.id+" r},"+this.right.v()+")";
}
return rv}
;
function ph_postfix_op(left,id,pctx){if(!left.is_ref&&!left.is_id)throw "Invalid argument for postfix op '"+id+"'";this.left=left;
this.id=id;
this.line=pctx.line;
this.is_nblock=left.is_nblock;
}
ph_postfix_op.prototype=new ph();
ph_postfix_op.prototype.is_value=true;
ph_postfix_op.prototype.nblock_val=function(){return this.left.nb()+this.id+" "}
;
ph_postfix_op.prototype.val=function(){var rv;if(this.left.is_nblock){rv=nblock_val_to_val(this.nb(),true,this.line);
}
else if(this.right.is_ref){rv="__oni_rt.Scall("+this.line+",function(l){return l[0][l[1]]"+this.id+"},"+this.left.ref()+")";
}
return rv}
;
function gen_identifier(value,pctx){if(value=="hold"){var rv=new ph_literal('__oni_rt.Hold',pctx);rv.esc_lit=true;
rv.is_id=true;
return rv}
else if(value=="spawn"){var rv=new ph_literal('__oni_rt.Spawn',pctx);rv.esc_lit=true;
rv.is_id=true;
return rv}
return new ph_identifier(value,pctx)}
function ph_identifier(value,pctx){this.value=value;
this.line=pctx.line;
}
ph_identifier.prototype=new ph();
ph_identifier.prototype.is_nblock=true;
ph_identifier.prototype.is_id=true;
ph_identifier.prototype.is_value=true;
ph_identifier.prototype.nblock_val=function(){return this.value}
;
ph_identifier.prototype.val=function(){return nblock_val_to_val(this.value,true,this.line)}
;
function is_nblock_arr(arr){for(var i=0;i<arr.length;++i)if(!arr[i].is_nblock)return false;return true}
function ph_fun_call(l,args,pctx){this.l=l;
this.args=args;
this.nblock_form=l.is_nblock&&is_nblock_arr(args);
this.line=pctx.line;
}
ph_fun_call.prototype=new ph();
ph_fun_call.prototype.is_value=true;
ph_fun_call.prototype.nblock_val=function(){var rv=this.l.nb()+"(";for(var i=0;i<this.args.length;++i){if(i)rv+=",";
rv+=this.args[i].nb();
}
return rv+")"}
;
ph_fun_call.prototype.val=function(){var rv;if(this.nblock_form){rv=this.l.nb()+"(";
for(var i=0;i<this.args.length;++i){if(i)rv+=",";
rv+=this.args[i].nb();
}
return nblock_val_to_val(rv+")",true,this.line)}
else if(this.l.is_ref){rv="__oni_rt.Fcall(1,"+this.line+","+this.l.ref();
}
else{rv="__oni_rt.Fcall(0,"+this.line+","+this.l.v();
}
for(var i=0;i<this.args.length;++i){rv+=","+this.args[i].v();
}
rv+=")";
return rv}
;
function ph_dot_accessor(l,name,pctx){this.l=l;
this.name=name;
this.line=pctx.line;
this.is_nblock=l.is_nblock;
}
ph_dot_accessor.prototype=new ph();
ph_dot_accessor.prototype.is_ref=true;
ph_dot_accessor.prototype.is_value=true;
ph_dot_accessor.prototype.nblock_val=function(){return this.l.nb()+"."+this.name}
;
ph_dot_accessor.prototype.val=function(){return "__oni_rt.Scall("+this.line+",function(l){return l."+this.name+";},"+this.l.v()+")"}
;
ph_dot_accessor.prototype.ref=function(){return "__oni_rt.Scall("+this.line+",function(l){return [l,'"+this.name+"'];},"+this.l.v()+")"}
;
function ph_idx_accessor(l,idxexp,pctx){this.l=l;
this.idxexp=idxexp;
this.line=pctx.line;
this.is_nblock=l.is_nblock&&idxexp.is_nblock;
}
ph_idx_accessor.prototype=new ph();
ph_idx_accessor.prototype.is_ref=true;
ph_idx_accessor.prototype.is_value=true;
ph_idx_accessor.prototype.nblock_val=function(){return this.l.nb()+"["+this.idxexp.nb()+"]"}
;
ph_idx_accessor.prototype.val=function(){return "__oni_rt.Scall("+this.line+",function(l, idx){return l[idx];},"+this.l.v()+","+this.idxexp.v()+")"}
;
ph_idx_accessor.prototype.ref=function(){if(this.is_nblock)return "(function(arguments){return ["+this.l.nb()+","+this.idxexp.nb()+"]})";else return "__oni_rt.Scall("+this.line+",function(l, idx){return [l, idx];},"+this.l.v()+","+this.idxexp.v()+")"}
;
function ph_group(e){this.e=e;
this.is_nblock=e.is_nblock;
}
ph_group.prototype=new ph();
ph_group.prototype.is_value=true;
ph_group.prototype.nblock_val=function(){return "("+this.e.nb()+")"}
;
ph_group.prototype.val=function(){return this.e.v()}
;
function ph_arr_lit(elements,pctx){this.elements=elements;
this.line=pctx.line;
this.is_nblock=is_nblock_arr(elements);
}
ph_arr_lit.prototype=new ph();
ph_arr_lit.prototype.is_value=true;
ph_arr_lit.prototype.nblock_val=function(){var rv="[";for(var i=0;i<this.elements.length;++i){if(i)rv+=",";
rv+=this.elements[i].nb();
}
return rv+"]"}
;
ph_arr_lit.prototype.val=function(){var rv="__oni_rt.Scall("+this.line+",__oni_rt.Arr";for(var i=0;i<this.elements.length;++i){rv+=","+this.elements[i].v();
}
return rv+")"}
;
function ph_obj_lit(props,pctx){this.props=props;
this.line=pctx.line;
this.is_nblock=(function(){for(var i=0;i<props.length;++i)if(!props[i][2].is_nblock)return false;return true}
)();
}
ph_obj_lit.prototype=new ph();
ph_obj_lit.prototype.is_value=true;
ph_obj_lit.prototype.nblock_val=function(){var rv="{";for(var i=0;i<this.props.length;++i){if(i!=0)rv+=",";
rv+=this.props[i][1]+":"+this.props[i][2].nb();
}
return rv+"}"}
;
ph_obj_lit.prototype.val=function(){var rv="__oni_rt.Scall("+this.line+",__oni_rt.Obj, [";for(var i=0;i<this.props.length;++i){if(i)rv+=",";
var name=this.props[i][1];if(name.charAt(0)!="'"&&name.charAt(0)!='"')name='"'+name+'"';
rv+=name;
}
rv+="]";
for(var i=0;i<this.props.length;++i){rv+=","+this.props[i][2].v();
}
return rv+")"}
;
function ph_conditional(t,c,a,pctx){this.t=t;
this.c=c;
this.a=a;
this.line=t.line;
this.is_nblock=t.is_nblock&&c.is_nblock&&a.is_nblock;
}
ph_conditional.prototype=new ph();
ph_conditional.prototype.is_value=true;
ph_conditional.prototype.nblock_val=function(){return this.t.nb()+"?"+this.c.nb()+":"+this.a.nb()}
;
ph_conditional.prototype.val=function(){return "__oni_rt.If("+this.t.v()+","+this.c.v()+","+this.a.v()+")"}
;
function ph_new(exp,args){this.exp=exp;
this.args=args;
this.line=exp.line;
}
ph_new.prototype=new ph();
ph_new.prototype.is_value=true;
ph_new.prototype.nblock_val=function(){var rv="new "+this.exp.nb()+"(";for(var i=0;i<this.args.length;++i){if(i)rv+=",";
rv+=this.args[i].nb();
}
return rv+")"}
;
ph_new.prototype.val=function(){var rv="__oni_rt.Fcall(2,"+this.line+","+this.exp.v();for(var i=0;i<this.args.length;++i){rv+=","+this.args[i].v();
}
rv+=")";
return rv}
;
function gen_waitfor_andor(op,blocks,crf,pctx){if(crf[0]||crf[1]||crf[2])return new ph_try(new ph_par_alt(op,blocks),crf,pctx);else return new ph_par_alt(op,blocks)}
function ph_par_alt(op,blocks){this.op=op;
this.blocks=blocks;
}
ph_par_alt.prototype=new ph();
ph_par_alt.prototype.is_nblock=false;
ph_par_alt.prototype.val=function(){var rv="__oni_rt.";if(this.op=="and")rv+="Par(";
else rv+="Alt(";
for(var i=0;i<this.blocks.length;++i){var b=this.blocks[i].v();if(!b.length)b="0";
if(i)rv+=",";
rv+=b;
}
return rv+")"}
;
function gen_suspend(has_var,decls,block,crf,pctx){var rv;if(has_var){rv=gen_var_compound(decls,pctx);
rv.stmts.push(gen_suspend_inner(decls,block,crf,pctx));
rv=rv.toBlock();
}
else rv=gen_suspend_inner(decls,block,crf,pctx);
return rv}
function gen_suspend_inner(decls,block,crf,pctx){var wrapped=(crf[0]||crf[1]||crf[2]);var rv=new ph_suspend(decls,block,wrapped,pctx);if(wrapped)rv=new ph_suspend_wrapper((new ph_try(rv,crf,pctx)).v(),pctx);
return rv}
function ph_suspend(decls,block,wrapped,pctx){this.decls=decls;
this.block=block;
this.wrapped=wrapped;
this.file=pctx.fn;
}
ph_suspend.prototype=new ph();
ph_suspend.prototype.val=function(){var rv="__oni_rt.Suspend(function(arguments, ";if(this.wrapped)rv+="_oniX){resume=_oniX;";
else rv+="resume){";
var b=this.block.v();if(b.length)rv+="return __oni_rt.exec("+b+",arguments,this,'"+this.file+"')";
rv+="}, function() {";
for(var i=0;i<this.decls.length;++i){var name=this.decls[i][0];if(name=="arguments")throw "Cannot use 'arguments' as variable name in waitfor()";rv+=name+"=arguments["+i+"];";
}
rv+="})";
return rv}
;
function ph_suspend_wrapper(code,pctx){this.code=code;
this.line=pctx.line;
this.file=pctx.fn;
}
ph_suspend_wrapper.prototype=new ph();
ph_suspend_wrapper.prototype.val=function(){return "__oni_rt.Scall("+this.line+",function(arguments){var resume; return __oni_rt.exnm("+this.code+",arguments, this,'"+this.file+"')}, function(a){return a;})"}
;
function gen_using(has_var,lhs,exp,body,pctx){var rv;if(has_var){if(!lhs.is_id)throw "Variable name expected in 'using' expression";rv=gen_var_compound([[lhs.nb()]],pctx);
rv.stmts.push(new ph_using(lhs,exp,body,pctx));
rv=rv.toBlock();
}
else rv=new ph_using(lhs,exp,body,pctx);
return rv}
function ph_using(lhs,exp,body,pctx){this.body=body||new ph_literal(0,pctx);
this.assign1=new ph_assign_op(new ph_identifier("_oniW",pctx),"=",exp,pctx);
if(lhs)this.assign2=new ph_assign_op(lhs,"=",new ph_identifier("_oniW",pctx),pctx);
this.line=exp.line;
this.file=pctx.fn;
}
ph_using.prototype=new ph();
ph_using.prototype.val=function(){var rv="__oni_rt.Scall(";rv+=this.line+",";
rv+="function(arguments){var _oniW; return __oni_rt.exnm(__oni_rt.Seq("+0+",";
rv+=this.assign1.v()+",";
if(this.assign2)rv+=this.assign2.v()+",";
rv+="__oni_rt.Try("+0+","+this.body.v();
rv+=",0,function(){if(_oniW&&_oniW.__finally__)return _oniW.__finally__()},0)";
rv+="),arguments,this,'"+this.file+"')},function(a){return a;})";
return rv}
;
function Hash(){}
Hash.prototype={lookup:function(key){return this["$"+key]}
,put:function(key,val){this["$"+key]=val;
}
,del:function(key){delete this["$"+key];
}
};
var TOKENIZER_SA=/(?:[ \f\r\t\v\u00A0\u2028\u2029]+|\/\/.*)*(?:((?:\n|\/\*(?:.|\n|\r)*?\*\/)+)|((?:0[xX][\da-fA-F]+)|(?:(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][-+]?\d+)?))|(\/(?:\\.|\[(?:\\.|[^\\n]])*\]|[^\/\n])+\/[gimy]*)|([$%_\w]+|==|!=|>>|<<|<=|>=|--|\+\+|\|\||&&|[-*\/%+&^|]=|[;,?:|^&=<>+\-*\/%!~.\[\]{}()])|('(?:\\.|[^\'\n])*'|"(?:\\.|[^\"\n])*")|('(?:\\.|[^\'])*'|"(?:\\.|[^\"])*")|(\S+))/g;var TOKENIZER_OP=/(?:[ \f\r\t\v\u00A0\u2028\u2029]+|\/\/.*)*(?:((?:\n|\/\*(?:.|\n|\r)*?\*\/)+)|(>>>=|===|!==|>>>|<<=|>>=|[$%_\w]+|==|!=|>>|<<|<=|>=|--|\+\+|\|\||&&|[-*\/%+&^|]=|[;,?:|^&=<>+\-*\/%!~.\[\]{}()]))/g;function SemanticToken(){}
SemanticToken.prototype={exsf:function(pctx,st){throw "Unexpected "+this}
,excbp:0,excf:function(left,pctx,st){throw "Unexpected "+this}
,stmtf:null,tokenizer:TOKENIZER_SA,toString:function(){return "'"+this.id+"'"}
,exs:function(f){this.exsf=f;
return this}
,exc:function(bp,f){this.excbp=bp;
if(f)this.excf=f;
return this}
,stmt:function(f){this.stmtf=f;
return this}
,ifx:function(bp,right_assoc){this.excbp=bp;
if(right_assoc)bp-=.5;
this.excf=function(left,pctx,st){var right=parseExp(pctx,bp,st);return new ph_infix_op(left,this.id,right,pctx)}
;
return this}
,asg:function(bp,right_assoc){this.excbp=bp;
if(right_assoc)bp-=.5;
this.excf=function(left,pctx,st){var right=parseExp(pctx,bp,st);return new ph_assign_op(left,this.id,right,pctx)}
;
return this}
,pre:function(bp){return this.exs(function(pctx,st){var right=parseExp(pctx,bp,st);return new ph_prefix_op(this.id,right,pctx)}
)}
,pst:function(bp){return this.exc(bp,function(left,pctx,st){return new ph_postfix_op(left,this.id,pctx)}
)}
};
function Literal(type,value){this.id=type;
this.value=value;
}
Literal.prototype=new SemanticToken();
Literal.prototype.tokenizer=TOKENIZER_OP;
Literal.prototype.toString=function(){return "literal '"+this.value+"'"}
;
Literal.prototype.exsf=function(pctx,st){return new ph_literal(this.value,pctx,this.id)}
;
function Identifier(value){this.value=value;
}
Identifier.prototype=new Literal("<id>");
Identifier.prototype.exsf=function(pctx,st){return gen_identifier(this.value,pctx)}
;
Identifier.prototype.toString=function(){return "identifier '"+this.value+"'"}
;
var ST=new Hash();function S(id,tokenizer){var t=new SemanticToken();t.id=id;
if(tokenizer)t.tokenizer=tokenizer;
ST.put(id,t);
return t}
S("[").exs(function(pctx,st){var elements=[];while(pctx.token.id!="]"){if(elements.length)scan(pctx,",");
if(pctx.token.id==","){elements.push((function(pctx){return new ph_literal("",pctx)}
)(pctx));
}
else if(pctx.token.id=="]")break;else elements.push(parseExp(pctx,110));
}
scan(pctx,"]");
return new ph_arr_lit(elements,pctx)}
).exc(270,function(l,pctx,st){var idxexp=parseExp(pctx);scan(pctx,"]");
return new ph_idx_accessor(l,idxexp,pctx)}
);
S(".").exc(270,function(l,pctx,st){if(pctx.token.id!="<id>")throw "Expected an identifier, found '"+pctx.token+"' instead";var name=pctx.token.value;scan(pctx);
return new ph_dot_accessor(l,name,pctx)}
);
S("new").exs(function(pctx,st){var exp=parseExp(pctx,0,"(");var args=[];if(pctx.token.id=="("){scan(pctx);
while(pctx.token.id!=")"){if(args.length)scan(pctx,",");
args.push(parseExp(pctx,110));
}
scan(pctx,")");
}
return new ph_new(exp,args)}
);
S("(").exs(function(pctx,st){var e=parseExp(pctx);scan(pctx,")");
return new ph_group(e)}
).exc(260,function(l,pctx,st){var args=[];while(pctx.token.id!=")"){if(args.length)scan(pctx,",");
args.push(parseExp(pctx,110));
}
scan(pctx,")");
return new ph_fun_call(l,args,pctx)}
);
S("++").pre(240).pst(250).asi_restricted=true;
S("--").pre(240).pst(250).asi_restricted=true;
S("delete").pre(240);
S("void").pre(240);
S("typeof").pre(240);
S("+").pre(240).ifx(220);
S("-").pre(240).ifx(220);
S("~").pre(240);
S("!").pre(240);
S("*").ifx(230);
S("/").ifx(230);
S("%").ifx(230);
S("<<").ifx(210);
S(">>").ifx(210);
S(">>>").ifx(210);
S("<").ifx(200);
S(">").ifx(200);
S("<=").ifx(200);
S(">=").ifx(200);
S("instanceof").ifx(200);
S("in").ifx(200);
S("==").ifx(190);
S("!=").ifx(190);
S("===").ifx(190);
S("!==").ifx(190);
S("&").ifx(180);
S("^").ifx(170);
S("|").ifx(160);
S("&&").ifx(150);
S("||").ifx(140);
S("?").exc(130,function(test,pctx,st){var consequent=parseExp(pctx,110);scan(pctx,":");
var alternative=parseExp(pctx,110);return new ph_conditional(test,consequent,alternative,pctx)}
);
S("=").asg(120,true);
S("*=").asg(120,true);
S("/=").asg(120,true);
S("%=").asg(120,true);
S("+=").asg(120,true);
S("-=").asg(120,true);
S("<<=").asg(120,true);
S(">>=").asg(120,true);
S(">>>=").asg(120,true);
S("&=").asg(120,true);
S("^=").asg(120,true);
S("|=").asg(120,true);
S(",").ifx(110,true);
function validatePropertyName(token){var id=token.id;if(id!="<id>"&&id!="<string>"&&id!="<number>")throw "Invalid object literal syntax; property name expected, but saw "+prop}
function parseBlock(pctx){push_stmt_scope(pctx);
while(pctx.token.id!="}"){var stmt=parseStmt(pctx);add_stmt(stmt,pctx);
}
scan(pctx,"}");
return pop_block(pctx)}
S("{").exs(function(pctx,st){var props=[];while(pctx.token.id!="}"){if(props.length)scan(pctx,",");
var prop=pctx.token;if(prop.id=="}")break;validatePropertyName(prop);
scan(pctx);
if(pctx.token.id==":"){scan(pctx);
var exp=parseExp(pctx,110);props.push(["prop",prop.value,exp]);
}
else throw "Unexpected token '"+pctx.token+"'"}
scan(pctx,"}",TOKENIZER_OP);
return new ph_obj_lit(props,pctx)}
).stmt(parseBlock);
S(";").stmt(function(pctx){return undefined}
);
S(")",TOKENIZER_OP);
S("]",TOKENIZER_OP);
S("}");
S(":");
S("<eof>").exs(function(pctx,st){throw "Unexpected end of input (exs)"}
).stmt(function(pctx){throw "Unexpected end of input (stmt)"}
);
function parseFunctionBody(pctx){push_decl_scope(pctx);
push_stmt_scope(pctx);
scan(pctx,"{");
while(pctx.token.id!="}"){var stmt=parseStmt(pctx);add_stmt(stmt,pctx);
}
scan(pctx,"}");
return pop_decl_scope(pctx)+pop_stmt_scope(pctx,"return __oni_rt.exseq(arguments,this,'"+pctx.fn+"',["+1,"])")}
function parseFunctionInner(pctx,pars){var par=scan(pctx,"(");while(pctx.token.id!=")"){if(pars.length)par=scan(pctx,",");
if(par.id!="<id>")throw "Expected parameter name; found '"+par+"'";scan(pctx);
pars.push(par.value);
}
scan(pctx,")");
return parseFunctionBody(pctx)}
S("function").exs(function(pctx,st){var fname="";if(pctx.token.id=="<id>"){fname=pctx.token.value;
scan(pctx);
}
var pars=[];var body=parseFunctionInner(pctx,pars);return new ph_fun_exp(fname,pars,body,pctx)}
).stmt(function(pctx){if(pctx.token.id!="<id>")throw "Malformed function declaration";var fname=pctx.token.value;scan(pctx);
var pars=[];var body=parseFunctionInner(pctx,pars);return gen_fun_decl(fname,pars,body,pctx)}
);
S("this",TOKENIZER_OP).exs(function(pctx,st){return new ph_identifier('this',pctx)}
);
S("true",TOKENIZER_OP).exs(function(pctx,st){return new ph_literal('true',pctx)}
);
S("false",TOKENIZER_OP).exs(function(pctx,st){return new ph_literal('false',pctx)}
);
S("null",TOKENIZER_OP).exs(function(pctx,st){return new ph_literal('null',pctx)}
);
function isStmtTermination(token){return token.id==";"||token.id=="}"||token.id=="<eof>"}
function parseStmtTermination(pctx){if(pctx.token.id!="}"&&pctx.token.id!="<eof>"&&!pctx.newline)scan(pctx,";");
}
function parseVarDecls(pctx,st){var decls=[];do {if(decls.length)scan(pctx,",");
var id=pctx.token.value;scan(pctx,"<id>");
if(pctx.token.id=="="){scan(pctx);
var initialiser=parseExp(pctx,110,st);decls.push([id,initialiser]);
}
else decls.push([id]);
}
while(pctx.token.id==",");return decls}
S("var").stmt(function(pctx){var decls=parseVarDecls(pctx);parseStmtTermination(pctx);
return gen_var_decl(decls,pctx)}
);
S("else");
S("if").stmt(function(pctx){scan(pctx,"(");
var test=parseExp(pctx);scan(pctx,")");
var consequent=parseStmt(pctx);var alternative=null;if(pctx.token.id=="else"){scan(pctx);
alternative=parseStmt(pctx);
}
return new ph_if(test,consequent,alternative,pctx)}
);
S("while").stmt(function(pctx){scan(pctx,"(");
var test=parseExp(pctx);scan(pctx,")");
var body=parseStmt(pctx);return new ph_loop(0,test,body)}
);
S("do").stmt(function(pctx){var body=parseStmt(pctx);scan(pctx,"while");
scan(pctx,"(");
var test=parseExp(pctx);scan(pctx,")");
parseStmtTermination(pctx);
return new ph_loop(2,test,body)}
);
S("for").stmt(function(pctx){scan(pctx,"(");
var start_exp=null;var decls=null;if(pctx.token.id=="var"){scan(pctx);
decls=parseVarDecls(pctx,"in");
}
else{if(pctx.token.id!=";")start_exp=parseExp(pctx,0,"in");
}
if(pctx.token.id==";"){scan(pctx);
var test_exp=null;if(pctx.token.id!=";")test_exp=parseExp(pctx);
scan(pctx,";");
var inc_exp=null;if(pctx.token.id!=")")inc_exp=parseExp(pctx);
scan(pctx,")");
var body=parseStmt(pctx);return gen_for(start_exp,decls,test_exp,inc_exp,body,pctx)}
else if(pctx.token.id=="in"){scan(pctx);
if(decls&&decls.length>1)throw "More that one variable declaration in for-in loop";var obj_exp=parseExp(pctx);scan(pctx,")");
var body=parseStmt(pctx);var decl=decls?decls[0]:null;return gen_for_in(start_exp,decl,obj_exp,body,pctx)}
else throw "Unexpected token '"+pctx.token+"' in for-statement"}
);
S("continue").stmt(function(pctx){var label=null;if(pctx.token.id=="<id>"&&!pctx.newline){label=pctx.token.value;
scan(pctx);
}
parseStmtTermination(pctx);
return new ph_cfe("c",label)}
);
S("break").stmt(function(pctx){var label=null;if(pctx.token.id=="<id>"&&!pctx.newline){label=pctx.token.value;
scan(pctx);
}
parseStmtTermination(pctx);
return new ph_cfe("b",label)}
);
S("return").stmt(function(pctx){var exp=null;if(!isStmtTermination(pctx.token)&&!pctx.newline)exp=parseExp(pctx);
parseStmtTermination(pctx);
return new ph_return(exp,pctx)}
);
S("with").stmt(function(pctx){scan(pctx,"(");
var exp=parseExp(pctx);scan(pctx,")");
var body=parseStmt(pctx);return new ph_with(exp,body,pctx)}
);
S("case");
S("default");
S("switch").stmt(function(pctx){scan(pctx,"(");
var exp=parseExp(pctx);scan(pctx,")");
scan(pctx,"{");
var clauses=[];while(pctx.token.id!="}"){var clause_exp=null;if(pctx.token.id=="case"){scan(pctx);
clause_exp=parseExp(pctx);
}
else if(pctx.token.id=="default"){scan(pctx);
}
else throw "Invalid token '"+pctx.token+"' in switch statement";scan(pctx,":");
push_stmt_scope(pctx);
top_stmt_scope(pctx).exp=clause_exp;
while(pctx.token.id!="case"&&pctx.token.id!="default"&&pctx.token.id!="}"){var stmt=parseStmt(pctx);add_stmt(stmt,pctx);
}
clauses.push((function(pctx){var cexp=top_stmt_scope(pctx).exp;var block=pop_block(pctx);return "["+(cexp?cexp.v():"__oni_rt.Default")+","+block.v()+"]"}
)(pctx));
}
scan(pctx,"}");
return new ph_switch(exp,clauses);(exp,clauses,pctx);
}
);
S("throw").stmt(function(pctx){if(pctx.newline)throw "Illegal newline after throw";var exp=parseExp(pctx);parseStmtTermination(pctx);
return new ph_throw(exp,pctx);}
);
S("catch");
S("finally");
function parseCRF(pctx){var rv=[];var a=null;if(pctx.token.id=="catch"||pctx.token.value=="catchall"){var all=pctx.token.value=="catchall";a=[];
scan(pctx);
a.push(scan(pctx,"(").value);
scan(pctx,"<id>");
scan(pctx,")");
scan(pctx,"{");
a.push(parseBlock(pctx));
a.push(all);
}
rv.push(a);
if(pctx.token.value=="retract"){scan(pctx);
scan(pctx,"{");
rv.push(parseBlock(pctx));
}
else rv.push(null);
if(pctx.token.id=="finally"){scan(pctx);
scan(pctx,"{");
rv.push(parseBlock(pctx));
}
else rv.push(null);
return rv}
S("try").stmt(function(pctx){scan(pctx,"{");
var block=parseBlock(pctx);var crf=parseCRF(pctx);if(!crf[0]&&!crf[1]&&!crf[2])throw "Missing 'catch', 'finally' or 'retract' after 'try'";return new ph_try(block,crf,pctx)}
);
S("waitfor").stmt(function(pctx){if(pctx.token.id=="{"){scan(pctx,"{");
var blocks=[];blocks.push(parseBlock(pctx));
var op=pctx.token.value;if(op!="and"&&op!="or")throw "Missing 'and' or 'or' after 'waitfor' block";do {scan(pctx);
scan(pctx,"{");
blocks.push(parseBlock(pctx));
}
while(pctx.token.value==op);var crf=parseCRF(pctx);return gen_waitfor_andor(op,blocks,crf,pctx)}
else{scan(pctx,"(");
var has_var=(pctx.token.id=="var");if(has_var)scan(pctx);
var decls=[];if(pctx.token.id==")"){if(has_var)throw "Missing variables in waitfor(var)"}
else decls=parseVarDecls(pctx);
scan(pctx,")");
scan(pctx,"{");
++top_decl_scope(pctx).fscoped_ctx;
var block=parseBlock(pctx);var crf=parseCRF(pctx);--top_decl_scope(pctx).fscoped_ctx;
return gen_suspend(has_var,decls,block,crf,pctx)}
}
);
S("using").stmt(function(pctx){var has_var;scan(pctx,"(");
if(has_var=(pctx.token.id=="var"))scan(pctx);
var lhs,exp;var e1=parseExp(pctx,120);if(pctx.token.id=="="){lhs=e1;
scan(pctx);
exp=parseExp(pctx);
}
else{if(has_var)throw "Syntax error in 'using' expression";exp=e1;
}
scan(pctx,")");
var body=parseStmt(pctx);return gen_using(has_var,lhs,exp,body,pctx)}
);
S("__js").stmt(function(pctx){++pctx.nb_ctx;
var body=parseStmt(pctx);--pctx.nb_ctx;
body.is_nblock=true;
return body}
);
function makeParserContext(src,settings){var ctx={src:src,line:1,lastIndex:0,token:null};if(settings)for(var a in settings)ctx[a]=settings[a];
return ctx}
function compile(src,settings){var pctx=makeParserContext(src+"\n",settings);try{return parseScript(pctx)}
catch(e){throw new Error("SJS syntax error "+(pctx.filename?"in "+pctx.filename+",":"at")+" line "+pctx.line+": "+e)}
}
exports.compile=compile;
function parseScript(pctx){begin_script(pctx);
scan(pctx);
while(pctx.token.id!="<eof>"){var stmt=parseStmt(pctx);add_stmt(stmt,pctx);
}
return end_script(pctx)}
function parseStmt(pctx){var t=pctx.token;scan(pctx);
if(t.stmtf){return t.stmtf(pctx)}
else if(t.id=="<id>"&&pctx.token.id==":"){scan(pctx);
var stmt=parseStmt(pctx);throw "labeled statements not implemented yet"}
else{var exp=parseExp(pctx,0,null,t);parseStmtTermination(pctx);
return new ph_exp_stmt(exp,pctx)}
}
function parseExp(pctx,bp,st,t){bp=bp||0;
if(!t){t=pctx.token;
scan(pctx);
}
var left=t.exsf(pctx,st);while(bp<pctx.token.excbp&&pctx.token.id!=st){t=pctx.token;
if(pctx.newline&&(!t.excf||t.asi_restricted))return left;scan(pctx);
left=t.excf(left,pctx,st);
}
return left}
function scan(pctx,id,tokenizer){if(!tokenizer){if(pctx.token)tokenizer=pctx.token.tokenizer;
else tokenizer=TOKENIZER_SA;
}
if(id&&(!pctx.token||pctx.token.id!=id))throw "Unexpected "+pctx.token;pctx.token=null;
pctx.newline=0;
while(!pctx.token){tokenizer.lastIndex=pctx.lastIndex;
var matches=tokenizer.exec(pctx.src);if(!matches){pctx.token=ST.lookup("<eof>");
break}
pctx.lastIndex=tokenizer.lastIndex;
if(tokenizer==TOKENIZER_SA){if(matches[4]){pctx.token=ST.lookup(matches[4]);
if(!pctx.token){pctx.token=new Identifier(matches[4]);
}
}
else if(matches[1]){var m=matches[1].match(/\n/g);if(m){pctx.line+=m.length;
pctx.newline+=m.length;
}
}
else if(matches[5])pctx.token=new Literal("<string>",matches[5]);
else if(matches[6]){var val=matches[6];var m=val.match(/\n/g);pctx.line+=m.length;
pctx.newline+=m.length;
val=val.replace(/\\\n/g,"").replace(/\n/g,"\\n");
pctx.token=new Literal("<string>",val);
}
else if(matches[2])pctx.token=new Literal("<number>",matches[2]);
else if(matches[3])pctx.token=new Literal("<regex>",matches[3]);
else if(matches[7])throw "Unexpected characters: '"+matches[7]+"'";else throw "Internal scanner error"}
else if(tokenizer==TOKENIZER_OP){if(matches[2]){pctx.token=ST.lookup(matches[2]);
if(!pctx.token){pctx.token=new Identifier(matches[2]);
}
}
else if(matches[1]){var m=matches[1].match(/\n/g);if(m){pctx.line+=m.length;
pctx.newline+=m.length;
}
}
else{tokenizer=TOKENIZER_SA;
}
}
else throw "Internal scanner error: no tokenizer"}
return pctx.token}
})(__oni_rt.c1={});