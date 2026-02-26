package com.ctd.xanadu.node.visitor;
import com.ctd.xanadu.node.DocumentNode;
import com.ctd.xanadu.node.RootNode;


public abstract interface NodeVisitor<T>{

	public abstract T visitDocumentNode(DocumentNode n);
	public abstract T visitRootNode(RootNode n);


}
